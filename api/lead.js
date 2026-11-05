// Vercel serverless function: forwards an audit lead to GoHighLevel.
//
// Set GHL_WEBHOOK_URL in Vercel (Project > Settings > Environment Variables)
// to the URL of the "Inbound Webhook" trigger of a GHL workflow. The workflow
// maps the fields below onto the contact and custom fields, adds the tags and
// sends the results email.
//
// Without GHL_WEBHOOK_URL the quiz still works; the lead is just not sent.

const MAX_BODY = 20_000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) {
    console.warn("GHL_WEBHOOK_URL is not set; lead not forwarded.");
    return res.status(200).json({ ok: false, forwarded: false });
  }

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > MAX_BODY) return res.status(413).json({ ok: false, error: "Payload too large" });
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: "Invalid JSON" }); }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "Missing body" });

  const email = String(body.email || "").trim();
  if (!email || !email.includes("@") || email.length > 254) {
    return res.status(400).json({ ok: false, error: "Valid email required" });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, email, submitted_at: new Date().toISOString() }),
    });
    if (!r.ok) {
      console.error("GHL webhook returned", r.status);
      return res.status(502).json({ ok: false, forwarded: false });
    }
    return res.status(200).json({ ok: true, forwarded: true });
  } catch (e) {
    console.error("GHL webhook error:", e);
    return res.status(502).json({ ok: false, forwarded: false });
  }
}
