// Daily "Africa Pain Radar" idea generator.
// Pulls recent headlines from Google News RSS (no API key needed) for a rotating
// topic/category, then asks a Groq-hosted model to turn the most concrete one into
// a single idea entry matching ideas.json's schema. Never invents sources — only
// cites URLs actually returned by the news search.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDEAS_PATH = path.join(__dirname, "..", "ideas.json");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY secret. Set it in repo Settings -> Secrets and variables -> Actions.");
  process.exit(1);
}

// Buttondown sends the daily idea by email (no domain purchase required — it
// sends from Buttondown's own shared infrastructure). Optional: if this secret
// isn't set, email sending is just skipped (site + ideas.json still update fine).
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;

// Rotating list of (query, category) pairs. Add more over time to keep variety up.
const QUERIES = [
  { q: "Nigeria POS agent banking network down complaint", category: "POS & Agent Banking" },
  { q: "Kenya smallholder farmer financing gap", category: "Agri-fintech" },
  { q: "Africa cross-border remittance fees complaint", category: "Fintech & Payments" },
  { q: "Nigeria fuel scarcity transport cost complaint", category: "Logistics & Transport" },
  { q: "Africa rural healthcare diagnostics access gap", category: "Health-tech" },
  { q: "Nigeria electricity blackout small business cost", category: "Energy" },
  { q: "Africa mobile data internet cost complaint", category: "Connectivity" },
  { q: "Nigeria Kenya gig worker delivery driver pay complaint", category: "Jobs & Gig Work" },
  { q: "Africa housing rent affordability crisis", category: "Housing" },
  { q: "Africa water scarcity small business climate", category: "Climate & Water" },
  { q: "Nigeria import customs cost SME complaint", category: "Trade & Logistics" },
  { q: "Ghana South Africa small business loan access complaint", category: "SME Finance" },
  { q: "Nigeria school fees education cost complaint", category: "Education" },
  { q: "Africa mobile money fraud scam complaint", category: "Fintech & Payments" },
  { q: "Kenya Uganda agriculture post-harvest loss complaint", category: "Agri-tech" }
];

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

// Every network call below goes through this so a slow/unresponsive server
// can never hang the whole GitHub Actions job (it used to have no timeout at
// all, which let one bad request stall the run indefinitely).
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:14d")}&hl=en-NG&gl=NG&ceid=NG:en`;
  let res;
  try {
    res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AfricaPainRadarBot/1.0)" } }, 10000);
  } catch (err) {
    console.error("News fetch timed out or failed:", err.message);
    return [];
  }
  if (!res.ok) {
    console.error("News fetch failed:", res.status);
    return [];
  }
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8).map(m => {
    const block = m[1];
    const title = ((block.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1])
      .replace("<![CDATA[", "").replace("]]>", "").trim();
    const link = ((block.match(/<link>([\s\S]*?)<\/link>/) || [, ""])[1]).trim();
    const pubDate = ((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [, ""])[1]).trim();
    return { title, link, pubDate };
  }).filter(it => it.title && it.link);
  return items;
}

async function callGroq(prompt) {
  const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  }, 30000);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function buildEmailHtml(idea) {
  const proofItems = (idea.proof || [])
    .map(p => `<li style="font-size:14px;margin-bottom:4px;">${p.text}${p.url ? ` <a href="${p.url}" style="color:#1f6f5c;">source ↗</a>` : ""}</li>`)
    .join("");
  return `<!-- buttondown-editor-mode: fancy --><!DOCTYPE html><html><body style="margin:0;padding:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#1c1a17;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px;">
<table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e9e3d8;border-radius:14px;padding:28px 26px;"><tr><td>
<div style="font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#c65d2e;margin-bottom:14px;">Africa Pain Radar — Daily Idea</div>
<h1 style="font-size:22px;margin:0 0 8px;">${idea.title}</h1>
<p style="font-size:14px;color:#6b6259;margin:0 0 20px;">${idea.tagline}</p>
<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#c65d2e;margin:16px 0 6px;">Why Now</div>
<p style="font-size:14px;margin:0 0 4px;">${idea.whyNow}</p>
<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#c65d2e;margin:16px 0 6px;">Proof &amp; Signals</div>
<ul style="margin:4px 0 0;padding-left:18px;">${proofItems}</ul>
<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#c65d2e;margin:16px 0 6px;">Market Gap</div>
<p style="font-size:14px;margin:0 0 4px;">${idea.marketGap}</p>
<div style="margin-top:22px;padding:16px 18px;background:#fffaf0;border:1px dashed #d9a441;border-radius:10px;text-align:center;">
<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#d9a441;margin-bottom:6px;">🔓 Build Blueprint — Premium</div>
<p style="font-size:13px;color:#6b6259;margin:0 0 12px;">Get the full MVP scope, first build steps, and monetization plan for this idea (and every past idea).</p>
<a href="https://buy.stripe.com/cNi6oHbhzfPT5Eldhu5wI00" style="display:inline-block;background:#d9a441;color:#2a1e08;font-weight:800;font-size:13.5px;padding:10px 20px;border-radius:999px;text-decoration:none;">Unlock Premium — $20/mo</a>
</div>
</td></tr></table>
<table width="100%" style="max-width:560px;"><tr><td align="center" style="padding:18px 10px;font-size:12px;color:#6b6259;">
See all ideas any time at <a href="https://africa-pain-radar.onrender.com" style="color:#1f6f5c;">africa-pain-radar.onrender.com</a><br>
Created by Anthony Onoja, Ph.D. — donmaston09@gmail.com
</td></tr></table>
</td></tr></table>
</body></html>`;
}

async function sendDailyEmail(idea) {
  if (!BUTTONDOWN_API_KEY) {
    console.log("BUTTONDOWN_API_KEY not set — skipping email send (site still updated fine).");
    return;
  }
  let res;
  try {
    res = await fetchWithTimeout("https://api.buttondown.com/v1/emails", {
      method: "POST",
      headers: {
        "Authorization": `Token ${BUTTONDOWN_API_KEY}`,
        "content-type": "application/json",
        // Required once per API key by Buttondown as a safety confirmation before
        // it will actually send (not just draft) an email created via the API.
        "X-Buttondown-Live-Dangerously": "true"
      },
      body: JSON.stringify({
        subject: `Today's idea: ${idea.title}`,
        body: buildEmailHtml(idea),
        status: "about_to_send"
      })
    }, 15000);
  } catch (err) {
    console.error("Buttondown request timed out or failed:", err.message);
    return; // don't fail the whole workflow just because the email didn't send
  }
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Buttondown API error ${res.status}: ${errText}`);
    return; // don't fail the whole workflow just because the email didn't send
  }
  console.log("Daily email queued via Buttondown for:", idea.title);
}

async function main() {
  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  const recentCategories = ideas.slice(0, 7).map(i => i.category);
  const existingIds = new Set(ideas.map(i => i.id));

  const today = new Date();
  const startIdx = dayOfYear(today) % QUERIES.length;

  // Walk the rotation starting from today's slot, skipping categories used
  // recently, and skipping any topic that turns up zero news items — so one
  // quiet topic doesn't cause the whole day's update (and email) to be skipped.
  let chosen = null;
  let newsItems = [];
  for (let step = 0; step < QUERIES.length; step++) {
    const candidate = QUERIES[(startIdx + step) % QUERIES.length];
    if (recentCategories.includes(candidate.category) && step < QUERIES.length - 1) {
      continue; // prefer a fresh category, but don't rule out the last resort
    }
    console.log("Trying topic:", candidate.q, "| category:", candidate.category);
    const items = await fetchNews(candidate.q);
    if (items.length > 0) {
      chosen = candidate;
      newsItems = items;
      break;
    }
    console.log("No news items found for that topic, trying the next one...");
  }

  if (!chosen) {
    console.log("No news items found for any topic today — skipping this run without failing the workflow.");
    return;
  }

  console.log("Chosen topic:", chosen.q, "| category:", chosen.category);

  const sourcesBlock = newsItems
    .map((it, i) => `${i + 1}. "${it.title}" — ${it.link} (published: ${it.pubDate})`)
    .join("\n");

  const prompt = `You are writing one entry for "Africa Pain Radar", a daily digest that turns real, documented pain points across Africa into startup ideas for an African founder audience (with a strong Nigerian segment).

Category focus for today: ${chosen.category}
Search query used: ${chosen.q}

Here are recent real news headlines and links found for this topic (use ONLY these as your source URLs in the "proof" field — never invent a statistic, quote, or URL not present here):
${sourcesBlock}

Ideas already covered recently, avoid overlapping topics: ${ideas.slice(0, 7).map(i => i.title).join("; ")}

Pick the single most concrete, specific pain point from the sources above and reply with ONLY one raw JSON object (no markdown fences, no commentary) in exactly this shape:

{
  "id": "kebab-case-slug",
  "title": "Short punchy title for the startup idea",
  "category": "${chosen.category}",
  "tagline": "One sentence naming the pain point in human terms",
  "dateAdded": "${today.toISOString().slice(0, 10)}",
  "whyNow": "1-2 sentences on why this is urgent/timely right now",
  "proof": [ { "text": "specific documented fact or quote", "url": "must be one of the URLs listed above" } ],
  "marketGap": "1-2 sentences on what's missing in the market today",
  "executionPlan": "2-4 sentences: MVP scope, first build steps, and a monetization angle",
  "competitor": "Name a real closest-existing competitor/alternative, or state none exists",
  "trend": "1 sentence on the broader trend making this timely"
}

Include 2-3 items in "proof", each citing a different one of the URLs above where possible. If the sources lack enough concrete detail, pick whichever has the most specific facts and quote them directly rather than generalizing.`;

  const raw = await callGroq(prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not find a JSON object in the model's response:\n" + raw);
  }

  const newIdea = JSON.parse(jsonMatch[0]);

  if (existingIds.has(newIdea.id)) {
    newIdea.id = `${newIdea.id}-${Date.now().toString(36)}`;
  }

  const updated = [newIdea, ...ideas].slice(0, 20);
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log("Added new idea:", newIdea.title);

  await sendDailyEmail(newIdea);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
