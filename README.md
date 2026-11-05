# Boko — AI Automation Audit

A self-contained React single-page app: a 3-minute AI-automation readiness quiz for
Australian fashion retailers, with GoHighLevel lead capture. Built with Vite,
served as a static site from an nginx container.

There is **no backend** — scoring and recommendations run entirely in the browser.

---

## 1. Lead capture (GoHighLevel)

On submit, the browser posts the contact and the full results (every answer,
each area score, total, readiness level, weakest area) to `/api/lead`.
`api/lead.js` is a Vercel function that forwards that JSON to GoHighLevel.

Setup, once:
1. In GHL, create a workflow with the **Inbound Webhook** trigger and copy its URL.
2. In Vercel: Project > Settings > Environment Variables, add `GHL_WEBHOOK_URL`
   with that URL, then redeploy.
3. In the GHL workflow, map the fields (`first_name`, `last_name`, `email`,
   `phone`, `company_name`, `audit_total_score`, `audit_readiness`,
   `audit_weakest_area`, `audit_content`, `audit_creative`, `audit_email`,
   `audit_ads`, `audit_reporting`, `audit_answers_text`), add the tags and
   send the results email.

Without `GHL_WEBHOOK_URL` the quiz still works; leads are just not sent.
The container (nginx) deploy has no `/api`, so lead capture only works on Vercel.

The "Book a strategy call" button mails `mariam@boko.com.au`; change that in
`App.jsx` if needed.

## Quiz structure

10 questions, 2 per area, each answer scored 0 to 3, so each area is out of 6
and the total is out of 30. Early Stage under 10, Developing 10 to 19,
Advanced 20 to 30. Areas: Product content, Social & ad creative,
Email & retention, Paid ads, Reporting & connected tools. Each maps to a
module of the AI-Powered Fashion Accelerator course.

Course demo answer set (used in the R1.1 and R1.2 scripts): answers scoring
1,1,1,1,2,2,1,1,0,1 give 11 out of 30, Developing, weakest area
Reporting & connected tools (1/6).

---

## 2. Run locally (optional sanity check)

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs static files to ./dist
npm run preview    # serves the built ./dist locally
```

---

## 3. Deploy as a container

The included multi-stage `Dockerfile` builds the site and serves it with nginx
on port 80.

```bash
# build the image
docker build -t boko-fashion-audit .

# run it locally on http://localhost:8080
docker run -p 8080:80 boko-fashion-audit
```

That image runs unchanged on any container host. Pick one:

### Render (simplest)
1. Push this folder to a GitHub repo.
2. Render → New → **Web Service** → connect the repo.
3. Runtime: **Docker**. Render auto-detects the Dockerfile. Leave port as 80.
4. Deploy. You get a public HTTPS URL.

### Fly.io
```bash
fly launch --no-deploy      # generates fly.toml; set internal_port = 80
fly deploy
```

### Railway
New Project → Deploy from GitHub repo → it detects the Dockerfile → set the
public port to 80 → deploy.

### AWS / GCP / generic VPS
Push the image to a registry and run it:
```bash
docker tag boko-fashion-audit <your-registry>/boko-fashion-audit:latest
docker push <your-registry>/boko-fashion-audit:latest
# on the server:
docker run -d --restart unless-stopped -p 80:80 <your-registry>/boko-fashion-audit:latest
```
Put it behind a load balancer / reverse proxy (or Cloudflare) for TLS, or
terminate HTTPS with Caddy/Traefik in front.

---

## 4. Custom domain + HTTPS
Point a DNS record (e.g. `audit.boko.com.au`) at the host. Render/Fly/Railway
issue TLS certificates automatically once you add the domain in their dashboard.
On a raw VPS, use Caddy or nginx + certbot in front of the container.

---

## Project structure
```
boko-fashion-audit/
├── Dockerfile        # multi-stage: node build → nginx serve
├── nginx.conf        # SPA routing, gzip, asset caching, security headers
├── index.html        # HTML shell + meta tags
├── package.json
├── vite.config.js
├── .dockerignore
├── .gitignore
└── src/
    ├── main.jsx      # React entry point
    └── App.jsx       # the audit app (quiz, scoring, results)
```
