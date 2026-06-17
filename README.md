# Boko — AI Automation Audit

A self-contained React single-page app: a 3-minute AI-automation readiness quiz for
Australian fashion retailers, with optional HubSpot lead capture. Built with Vite,
served as a static site from an nginx container.

There is **no backend** — scoring and recommendations run entirely in the browser.

---

## 1. HubSpot (already configured)

Lead capture is wired up to the Boko portal in `src/App.jsx`:

```js
const HS_PORTAL_ID = "8173960";
const HS_FORM_GUID = "31a9c609-ab93-4d80-8231-8aa50a945416";
```

To repoint it at a different form later, edit those two constants.

If you also want the per-area scores stored, create these custom contact
properties in HubSpot first (Settings → Properties → Create property):
`ai_audit_total_score`, `ai_audit_readiness`, `ai_audit_inventory`,
`ai_audit_customer`, `ai_audit_pricing`, `ai_audit_workforce`, `ai_audit_data`.

Leave the placeholders as-is and the quiz still works fully — it just won't push leads.

The "Book a strategy call" button mails `mariam@boko.com.au` — change that in
`src/App.jsx` if needed.

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
