# Deploy to Vercel via GitHub

Your app is a Vite static site, so Vercel builds and hosts it natively — no Docker
needed. `vercel.json` is already included and tells Vercel everything it needs
(framework = Vite, build = `npm run build`, output = `dist`, SPA rewrites).

You only do this once; after that, every `git push` auto-deploys.

---

## Step 1 — Put the code on GitHub

### Option A: GitHub website (no command line)
1. Go to https://github.com/new
2. Repository name: `boko-fashion-audit` · keep it Private if you prefer · **don't**
   tick "Add a README" (the project already has one).
3. Create repository, then on the next page click **"uploading an existing file"**.
4. Unzip `boko-fashion-audit.zip` on your computer and drag the **contents** of the
   folder (not the outer folder itself) into the browser — `src/`, `package.json`,
   `vercel.json`, `index.html`, etc.
5. Click **Commit changes**.

### Option B: command line (if you have git installed)
```bash
cd boko-fashion-audit
git init
git add .
git commit -m "Boko AI Automation Audit"
git branch -M main
git remote add origin https://github.com/<your-username>/boko-fashion-audit.git
git push -u origin main
```

---

## Step 2 — Import into Vercel
1. Go to https://vercel.com/new
2. Under **Import Git Repository**, pick `boko-fashion-audit`.
   (First time only: click **Add GitHub Account / Configure** and grant Vercel
   access to the repo.)
3. Vercel auto-detects **Vite**. Leave all build settings as-is — `vercel.json`
   handles them.
4. Click **Deploy**. ~1 minute later you get a live URL like
   `https://boko-fashion-audit.vercel.app`.

---

## Step 3 — Custom domain (optional)
Vercel project → **Settings → Domains** → add `audit.boko.com.au` (or similar),
then add the CNAME record Vercel shows you at your DNS provider. TLS is automatic.

---

## Updating later
Edit the code, `git push` (or re-upload via the website) → Vercel rebuilds and
redeploys automatically. Pull requests get their own preview URLs.

> Note: the included `Dockerfile`/`nginx.conf` are not used by Vercel — they're
> there in case you ever move to a container host. They do no harm on Vercel.
