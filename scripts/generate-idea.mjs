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

async function fetchNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " when:14d")}&hl=en-NG&gl=NG&ceid=NG:en`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AfricaPainRadarBot/1.0)" } });
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
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function main() {
  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  const recentCategories = ideas.slice(0, 7).map(i => i.category);
  const existingIds = new Set(ideas.map(i => i.id));

  const today = new Date();
  let idx = dayOfYear(today) % QUERIES.length;
  let chosen = QUERIES[idx];
  let attempts = 0;
  // Skip categories used in the last 7 entries where possible.
  while (recentCategories.includes(chosen.category) && attempts < QUERIES.length) {
    idx = (idx + 1) % QUERIES.length;
    chosen = QUERIES[idx];
    attempts++;
  }

  console.log("Chosen topic:", chosen.q, "| category:", chosen.category);

  const newsItems = await fetchNews(chosen.q);
  if (newsItems.length === 0) {
    console.log("No news items found for today's topic — skipping this run without failing the workflow.");
    return;
  }

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
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
