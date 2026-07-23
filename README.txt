AFRICA PAIN RADAR — STATUS + FULL-AUTOMATION SETUP
====================================================

WHAT'S IN THIS FOLDER
- index.html               → public site: hero, free signup (MailerLite + Buttondown), daily idea previews (blueprints locked).
- premium.html             → UNLISTED page with full build blueprints unlocked. Don't share this URL publicly.
- ideas.json               → the ONE shared data source both pages load from (via fetch). This is
                              what changes every day now — no more editing HTML directly.
- scripts/generate-idea.mjs→ the daily research script (news search + Groq), plus sends the daily email via Buttondown.
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
- MailerLite: signup box on the site works end-to-end — new emails get added as "unconfirmed" and
  automatically receive MailerLite's own double opt-in confirmation email (no domain of yours
  required for that part). Group: "Free Subscribers".
- Buttondown: a second, smaller signup box under the MailerLite one ("Prefer it by email?").
  This is the one that actually gets emailed the daily idea — see below for why there are two.

WHY TWO SIGNUP BOXES (MAILERLITE + BUTTONDOWN)?
MailerLite (and every other major email tool — Resend, SendGrid, etc.) requires you to own and
verify a domain with DNS records before it will send bulk/campaign emails to a list. Since you
don't want to buy a domain right now, Buttondown is the one exception: its free tier sends real
emails to real subscribers from its own shared address (no domain purchase needed), which is why
the daily idea email goes out through Buttondown specifically. MailerLite's box stays because it
already works today for capturing signups + sending its own confirmation email — no reason to
remove something that works. If you ever do buy a domain, everything can consolidate into one tool.

WHY YOU'RE SEEING NEW FILES/CHANGES TODAY
A GitHub Actions workflow researches one fresh, sourced African pain point every morning
(rotating news + institutional sources, with regular Nigeria-specific angles like POS/agent-banking
issues), commits it straight to ideas.json, and — new — emails it to every Buttondown subscriber.
All fully automatic, no manual steps once secrets are set.

ONE-TIME SETUP — ALREADY DONE
1. Groq API key (news → idea generation): saved as GitHub secret GROQ_API_KEY. ✅
2. Buttondown API key (daily email send): saved as GitHub secret BUTTONDOWN. ✅
   Buttondown username: donmaston09 (your emails go out from this account, free up to 100 subscribers).

HOW TO CONFIRM IT ALL WORKS
Go to https://github.com/Donmaston09/africa-pain-radar/actions, click "Daily Africa Pain Radar
Update" in the left sidebar, then "Run workflow" to trigger it once manually and check the logs.
If it succeeds: ideas.json gets a new commit, Render redeploys in a minute or two, and Buttondown
subscribers get emailed the new idea.

It otherwise runs on its own every day around 7:15am UK time (cron is in UTC, so it drifts an hour
between summer/winter — not adjustable without editing the workflow file).

IF YOU EVER WANT TO EDIT AN IDEA MANUALLY
Just edit ideas.json directly (it's a plain JSON array, same shape for every entry), then
commit and push as usual. Both index.html and premium.html will pick up the change automatically
on next page load — no other file needs touching. (Note: manual edits don't trigger a Buttondown
email — only the daily automated run does that.)

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
