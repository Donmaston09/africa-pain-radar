AFRICA PAIN RADAR — DEPLOY GUIDE (GitHub + Render)
====================================================

WHAT'S IN THIS FOLDER
- index.html    → the public site: hero, free signup, daily idea previews (blueprints locked).
- premium.html  → UNLISTED page with full build blueprints unlocked. Only reachable via the
                  link, not linked from index.html's navigation. Don't share this URL publicly.

This folder has no git repo yet (a first attempt from my side hit sandbox filesystem
permission quirks, so I cleaned it back to plain files). Render only deploys static sites
from a connected GitHub repo — there's no drag-and-drop upload like Netlify — so set it up
fresh from your own Mac:

STEP 1 — Push this folder to GitHub
Your repo already exists: https://github.com/Donmaston09/africa-pain-radar
Open Terminal on your Mac and run:
  cd ~/Desktop/Mary_Onoja/AfricaPainRadar
  git init
  git add -A
  git commit -m "Africa Pain Radar site"
  git remote add origin https://github.com/Donmaston09/africa-pain-radar.git
  git branch -M main
  git push -u origin main

Before running the last line, create the empty repo on GitHub first:
  1. Go to https://github.com/new
  2. Repository name: africa-pain-radar
  3. Visibility: Public
  4. Do NOT check "Add a README" (this folder already has one) — leave it empty, click Create.
  Then run the commands above (replace YOUR-GITHUB-USERNAME with your actual username).
  Git will ask you to sign in the first time — use your normal GitHub login/token, entered by you.

STEP 2 — Connect it to Render
  1. Go to https://dashboard.render.com → New → Static Site.
  2. Connect your GitHub account if prompted, then select the africa-pain-radar repo.
  3. Build Command: leave blank. Publish directory: . (a single dot, meaning repo root).
  4. Click Create Static Site. Render gives you a live URL like
     https://africa-pain-radar.onrender.com within a minute or two.

STEP 3 — Tell me the Render URL
Once you have it, tell me and I'll update the Stripe payment link's post-payment redirect
to point at https://YOUR-RENDER-URL/premium.html instead of the current placeholder.

PUBLISHING DAILY UPDATES
The Cowork scheduled task "africa-pain-radar-daily" updates this folder's index.html and
premium.html every morning with a fresh researched idea — but that only changes the files
sitting in this folder, it does NOT push them to GitHub automatically (pushing needs your
GitHub login, which has to come from you, not from an automated background task).
To publish a day's update, run this from the same folder whenever you want the live site
to catch up:
  cd ~/Desktop/Mary_Onoja/AfricaPainRadar
  git add -A && git commit -m "daily update" && git push
Render redeploys automatically within a minute of each push. If you'd rather this ran itself
with zero manual steps, that needs a GitHub Actions workflow with a scheduled cron + a stored
token on GitHub's side (not something I can set up for you since it involves entering a token
into GitHub's UI yourself) — ask if you want the exact workflow file for that.

PREMIUM TIER — $20/MONTH, TWO PAYMENT OPTIONS (LIVE, REAL MONEY)
Subscribers can pay either way — both are live and real:

  Stripe: https://buy.stripe.com/cNi6oHbhzfPT5Eldhu5wI00
  (Product + recurring $20/month price + payment link, on your "DataEdge Academy" Stripe account.)

  PayPal: https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-13G94405NH540752RNJQ67UA
  (A $20/month PayPal Subscriptions plan you created directly in your PayPal Business dashboard.
  On index.html this also renders as a live Smart Button, not just a link — the PayPal JS SDK
  is loaded at the bottom of the file. The Cowork artifact only shows the plain link version,
  since its sandbox blocks loading PayPal's script.)

IMPORTANT: both are LIVE (not test) — real cards/PayPal balances will be charged real money.

PAYOUT SETUP (you confirmed a supported-country Revolut account)
Stripe pays out to a bank account/IBAN you add yourself in the Dashboard — I can't enter
banking details on your behalf. To finish this:
  1. Stripe Dashboard → Settings → Bank accounts and scheduling (or Balance → Payout settings)
  2. Add bank account → enter your Revolut IBAN/account number
  3. Set it as the default payout method.
Since your Revolut account is registered under a Stripe-supported country, this should work
like any normal bank account — no other changes needed.

CONNECT THE FREE SIGNUP FORM (MailerLite)
A MailerLite account is connected and a "Free Subscribers" group + an embedded form
("Africa Pain Radar — Daily Signup") already exist, but the form still needs its visual
design finished in MailerLite before it has a working embed code:
1. Open https://dashboard.mailerlite.com/forms/193694070637332360/overview
2. Finish designing the form (MailerLite requires this step before publishing) and click Publish.
3. Go to the form's Embed tab, copy the JS/HTML snippet.
4. Open index.html, find the HTML comment block starting "MAILERLITE EMBED — replace this
   whole comment block...", and paste the snippet in place of the fallback <form> below it.
5. Commit + push (see "Publishing daily updates" above) to redeploy on Render.

There's also a "Premium ($20/mo Blueprints)" MailerLite group already created, ready for you
to manually add paying subscribers to (or connect via Zapier/Make later) so you can email
premium members directly.

CREATOR CREDIT
Anthony Onoja, Ph.D. — donmaston09@gmail.com — already added to the footer of both
index.html and premium.html, and the Cowork artifact.
