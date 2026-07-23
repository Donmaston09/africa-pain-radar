AFRICA PAIN RADAR — STATUS + FULL-AUTOMATION SETUP
====================================================

WHAT'S IN THIS FOLDER
- index.html               → public site: hero, free signup, daily idea previews (blueprints locked).
- premium.html             → UNLISTED page with full build blueprints unlocked. Don't share this URL publicly.
- ideas.json               → the ONE shared data source both pages load from (via fetch). This is
                              what changes every day now — no more editing HTML directly.
- scripts/generate-idea.mjs→ the daily research script (news search + Claude), run automatically.
- .github/workflows/daily-idea.yml → the GitHub Actions automation that runs the script daily.

ALREADY LIVE
- Site: https://africa-pain-radar.onrender.com (deployed on Render from your GitHub repo)
- Repo: https://github.com/Donmaston09/africa-pain-radar
- Stripe: https://buy.stripe.com/cNi6oHbhzfPT5Eldhu5wI00 ($20/mo, redirect already points at
  your live premium.html) — currently PAUSED until you finish Stripe's business verification
  (Settings → Business → Business details → "Add business information", plus phone verification
  under Account details). Once approved, it goes live automatically.
- PayPal: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-13G94405NH540752RNJQ67UA
  ($20/mo, working independently of Stripe's status)
- MailerLite: "Free Subscribers" + "Premium ($20/mo Blueprints)" groups exist; the embedded signup
  form still needs its visual design finished at
  https://dashboard.mailerlite.com/forms/193694070637332360/overview before it has a working
  embed code to paste into index.html (see the HTML comment marked "MAILERLITE EMBED" in that file).

WHY YOU'RE SEEING NEW FILES TODAY
Until now, a Cowork task updated index.html/premium.html directly, and you had to manually
git push each day for the live site to catch up. That's now replaced with a proper pipeline:
a GitHub Actions workflow researches one fresh, sourced African pain point every morning
(rotating Reddit/X, news, and institutional sources, with regular Nigeria-specific angles like
POS/agent-banking issues) and commits it straight to ideas.json — no manual steps, ever again,
once this is switched on.

ONE-TIME SETUP TO ACTIVATE FULL AUTOMATION (about 5 minutes)

The generator script calls Groq (not Anthropic) — a free inference API, no credit card
required, running an open model (Llama 3.3 70B) that's plenty capable for "read these
headlines, write one JSON entry."

1. Get a Groq API key:
   - Go to https://console.groq.com → sign up (email or Google/GitHub) → API Keys → Create API Key.
   - Copy it immediately (only shown once).
   - This is genuinely free — no card needed, and the daily limit is far higher than the
     one call/day this job makes.

2. Add it as a GitHub repository secret:
   - Go to https://github.com/Donmaston09/africa-pain-radar/settings/secrets/actions
   - Click "New repository secret"
   - Name: GROQ_API_KEY
   - Value: paste the key you copied
   - Click "Add secret"

3. Push these new files (the last manual push you should need for routine updates):
   cd ~/Desktop/Mary_Onoja/AfricaPainRadar
   git add -A
   git commit -m "Add automated daily idea pipeline"
   git push

4. Confirm it works: go to https://github.com/Donmaston09/africa-pain-radar/actions,
   click "Daily Africa Pain Radar Update" in the left sidebar, then "Run workflow" to
   trigger it once manually and check the logs. If it succeeds, you'll see a new commit
   to ideas.json and Render will redeploy automatically within a minute or two.

After that, it runs on its own every day around 7:15am UK time (the cron is in UTC, so it'll
drift by an hour between summer/winter — not adjustable without editing the workflow file).

IF YOU EVER WANT TO EDIT AN IDEA MANUALLY
Just edit ideas.json directly (it's a plain JSON array, same shape for every entry), then
commit and push as usual. Both index.html and premium.html will pick up the change automatically
on next page load — no other file needs touching.

PREMIUM TIER — $20/MONTH, TWO PAYMENT OPTIONS (LIVE, REAL MONEY)
Both Stripe and PayPal links above are LIVE, not test — real money moves when someone pays.

PAYOUT SETUP (Stripe → your Revolut account)
Stripe pays out to a bank account/IBAN you add yourself in the Dashboard — I can't enter
banking details on your behalf.
  1. Stripe Dashboard → Settings → Bank accounts and scheduling (or Balance → Payout settings)
  2. Add bank account → enter your Revolut IBAN/account number
  3. Set it as the default payout method.
Since your Revolut account is registered under a Stripe-supported country, this should work
like any normal bank account.

CREATOR CREDIT
Anthony Onoja, Ph.D. — donmaston09@gmail.com — in the footer of index.html, premium.html,
and the Cowork artifact.
