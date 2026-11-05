import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// LEAD CAPTURE
// Leads are posted to /api/lead (api/lead.js), a Vercel function that
// forwards them to the GoHighLevel inbound webhook set in the
// GHL_WEBHOOK_URL environment variable. Nothing secret lives in the browser.
// ═══════════════════════════════════════════════════════════════════
const LEAD_ENDPOINT = "/api/lead";

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS  (Boko brand)
// ═══════════════════════════════════════════════════════════════════
const LIME   = "#BFFC00";
const BLACK  = "#0A0A0A";
const GRAY   = "#4B5563";
const LGRAY  = "#F0F2F5";
const WHITE  = "#FFFFFF";
const FONT   = "'Poppins', system-ui, sans-serif";

// ═══════════════════════════════════════════════════════════════════
// QUIZ DATA  — 10 questions across 5 digital marketing areas for AU
// fashion brands. Each area maps to a module of the AI-Powered Fashion
// Accelerator course, so the results point students to the right lessons.
// ═══════════════════════════════════════════════════════════════════
export const AREAS = [
  { id: "content",   label: "Product content",            module: "Module 2" },
  { id: "creative",  label: "Social & ad creative",       module: "Module 2" },
  { id: "email",     label: "Email & retention",          module: "Module 3" },
  { id: "ads",       label: "Paid ads",                   module: "Module 4" },
  { id: "reporting", label: "Reporting & connected tools", module: "Modules 1 and 4" },
];

export const QUESTIONS = [
  // ── Product content ───────────────────────────────────────────
  { id: 1, area: "content",
    text: "How do you write titles and descriptions for new stock?",
    opts: [
      { text: "We copy the supplier's text",                                  score: 0 },
      { text: "We write each one by hand",                                    score: 1 },
      { text: "We use AI, one product at a time",                             score: 2 },
      { text: "AI writes the whole drop from the supplier sheet, we review",  score: 3 },
    ]},
  { id: 2, area: "content",
    text: "How do new products get into your online store?",
    opts: [
      { text: "One by one in Shopify",                                 score: 0 },
      { text: "A CSV we build by hand",                                score: 1 },
      { text: "Bulk import, then manual clean-up",                     score: 2 },
      { text: "Supplier sheet to draft products automatically",        score: 3 },
    ]},
  // ── Social & ad creative ──────────────────────────────────────
  { id: 3, area: "creative",
    text: "How do you plan and create social posts?",
    opts: [
      { text: "When we find time",                                      score: 0 },
      { text: "Made one at a time in Canva",                            score: 1 },
      { text: "A monthly calendar with templates",                      score: 2 },
      { text: "AI drafts the month's posts and captions, scheduled ahead", score: 3 },
    ]},
  { id: 4, area: "creative",
    text: "How do you produce new ad creatives?",
    opts: [
      { text: "We run the same few for months",                         score: 0 },
      { text: "A designer makes a few each month",                      score: 1 },
      { text: "Templates with new copy",                                score: 2 },
      { text: "A system producing fresh concepts every week",           score: 3 },
    ]},
  // ── Email & retention ─────────────────────────────────────────
  { id: 5, area: "email",
    text: "How do you personalise for repeat customers?",
    opts: [
      { text: "Everyone gets the same email",                                              score: 0 },
      { text: "Staff remember regulars, plus some manual lists",                           score: 1 },
      { text: "Segments by purchase history in our email platform (Klaviyo, Mailchimp)",   score: 2 },
      { text: "Automated personalisation by behaviour across email and SMS",               score: 3 },
    ]},
  { id: 6, area: "email",
    text: "Which automated emails do you have running?",
    opts: [
      { text: "None, newsletters only",                                         score: 0 },
      { text: "Welcome email only",                                             score: 1 },
      { text: "Welcome and abandoned cart",                                     score: 2 },
      { text: "Welcome, abandoned cart, post-purchase, win-back and VIP",       score: 3 },
    ]},
  // ── Paid ads ──────────────────────────────────────────────────
  { id: 7, area: "ads",
    text: "How are your Meta and Google ads run?",
    opts: [
      { text: "Boosted posts, or no ads",                              score: 0 },
      { text: "Only around sales",                                     score: 1 },
      { text: "Always on, reviewed monthly",                           score: 2 },
      { text: "Always on, weekly review and creative refresh",         score: 3 },
    ]},
  { id: 8, area: "ads",
    text: "How are your products set up for Google Shopping and Meta catalogues?",
    opts: [
      { text: "Not connected",                                                       score: 0 },
      { text: "Connected, with supplier titles",                                     score: 1 },
      { text: "Connected, some titles edited",                                       score: 2 },
      { text: "Titles optimised for how customers search, and kept updated",         score: 3 },
    ]},
  // ── Reporting & connected tools ───────────────────────────────
  { id: 9, area: "reporting",
    text: "How do you report on sales and marketing?",
    opts: [
      { text: "We don't, beyond Shopify's home screen",                         score: 0 },
      { text: "Numbers pulled into a spreadsheet monthly",                      score: 1 },
      { text: "Platform dashboards checked regularly",                          score: 2 },
      { text: "An automated weekly report across Shopify, email and ads",       score: 3 },
    ]},
  { id: 10, area: "reporting",
    text: "How connected are your tools (Shopify, POS, email, ads, accounting or ERP)?",
    opts: [
      { text: "We re-key data between them",                score: 0 },
      { text: "Some built-in integrations",                 score: 1 },
      { text: "Mostly connected, a few manual steps",       score: 2 },
      { text: "Fully connected, data flows automatically",  score: 3 },
    ]},
];

// ═══════════════════════════════════════════════════════════════════
// SCORING  — each answer 0 to 3, each area out of 6, total out of 30.
// Early Stage under 10, Developing 10 to 19, Advanced 20 to 30.
// ═══════════════════════════════════════════════════════════════════
export function calcScores(answers) {
  const areas = {};
  AREAS.forEach(({ id, label }) => {
    const qs = QUESTIONS.filter(q => q.area === id);
    const score = qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
    areas[id] = { score, max: qs.length * 3, label };
  });
  const total = Object.values(areas).reduce((s, a) => s + a.score, 0);
  const max = 30;
  const pct = Math.round((total / max) * 100);
  const label = total < 10 ? "Early Stage" : total < 20 ? "Developing" : "Advanced";
  const emoji = total < 10 ? "🔴" : total < 20 ? "🟡" : "🟢";
  // Lowest share of its area max first; ties keep the AREAS order.
  const weakest = AREAS
    .map(a => a.id)
    .sort((x, y) => (areas[x].score / areas[x].max) - (areas[y].score / areas[y].max))[0];
  return { total, max, pct, areas, label, emoji, weakest };
}

// ═══════════════════════════════════════════════════════════════════
// LEAD SUBMISSION  (GoHighLevel via /api/lead)
// Sends the contact plus the full results: every answer, every area
// score, the total, the readiness level and the weakest area.
// ═══════════════════════════════════════════════════════════════════
export function buildLeadPayload(contact, answers) {
  const sc = calcScores(answers);
  const name = (contact.name || "").trim();
  const answerRows = QUESTIONS.map(q => {
    const opt = q.opts.find(o => o.score === answers[q.id]);
    return { question: q.text, area: q.area, answer: opt ? opt.text : "", score: answers[q.id] ?? null };
  });
  return {
    first_name: name.split(" ")[0] || name,
    last_name:  name.split(" ").slice(1).join(" "),
    email:      (contact.email || "").trim(),
    phone:      (contact.phone || "").trim(),
    company_name: (contact.business || "").trim(),
    source:     "AI Automation Audit (audit.boko.com.au)",
    tags:       ["ai-automation-audit", `audit-${sc.label.toLowerCase().replace(" ", "-")}`],
    audit_total_score:   sc.total,
    audit_max_score:     sc.max,
    audit_readiness:     sc.label,
    audit_weakest_area:  sc.areas[sc.weakest].label,
    audit_content:       sc.areas.content.score,
    audit_creative:      sc.areas.creative.score,
    audit_email:         sc.areas.email.score,
    audit_ads:           sc.areas.ads.score,
    audit_reporting:     sc.areas.reporting.score,
    audit_answers:       answerRows,
    audit_answers_text:  answerRows.map((r, i) => `Q${i + 1}. ${r.question} ${r.answer} (${r.score}/3)`).join("\n"),
    page_url: typeof window !== "undefined" ? window.location.href : "",
  };
}

async function submitLead(contact, answers) {
  try {
    await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildLeadPayload(contact, answers)),
    });
  } catch (e) { console.warn("Lead submission error:", e); }
}

// ═══════════════════════════════════════════════════════════════════
// RECOMMENDATIONS  (score-based, no API call needed)
// Every recommendation is taught in the AI-Powered Fashion Accelerator.
// ═══════════════════════════════════════════════════════════════════
export const AREA_RECS = {
  content: {
    topOpportunity: "Product content is where most fashion brands lose the most hours. Every new drop means titles, descriptions and SEO written by hand, and supplier copy that nobody searches for.",
    quickWins:  [
      "Give Claude your next supplier sheet and have it draft the descriptions in your brand voice",
      "Rewrite the SEO titles and meta descriptions of your 20 best sellers to match how Australians search",
      "Run a Claude SEO audit on one product page that gets seen in Google but rarely clicked",
    ],
    threeMonth: [
      "Set up a weekly Claude task that turns new supplier sheets into Shopify draft products for you to review",
      "Add intro and buying guide copy to your top collection pages, like Dresses and Knitwear",
    ],
  },
  creative: {
    topOpportunity: "Fresh, genuinely different creative is now what drives Meta ad performance. Running the same few ads for months pushes your cost per sale up.",
    quickWins:  [
      "Plan six different ad concepts with Claude: a different angle, visual and format each, not just new headlines",
      "Build a Canva template for each concept and use Bulk Create for its headline variants",
      "Resize your best product photos to 1:1, 4:5 and 9:16 in one go",
    ],
    threeMonth: [
      "Set up a monthly social calendar where Claude drafts the posts and captions and you approve them",
      "Add new ad concepts every week, based on what last week's results showed",
    ],
  },
  email: {
    topOpportunity: "Email is your highest-margin channel. Customers who already bought from you are the easiest to bring back for the next drop, if the right flows are running.",
    quickWins:  [
      "Check your abandoned checkout flow is live and stops as soon as someone buys",
      "Build five segments in your email platform: champions, at-risk VIPs, potential loyalists, one-time buyers and lapsed customers",
      "Connect Klaviyo to Claude and ask what your high churn risk customers have in common",
    ],
    threeMonth: [
      "Build a three-email win-back flow timed to how often your customers actually buy",
      "Launch a VIP flow with early access to new collections for your best customers",
    ],
  },
  ads: {
    topOpportunity: "Ads that only run around sales, or run on supplier product titles, cost more per sale than they should. A clean product feed and a weekly review are the fastest fixes.",
    quickWins:  [
      "Set Data sharing to Maximum in Shopify's Facebook & Instagram app so Meta can see your sales",
      "Rewrite the Google Shopping titles of your top 20 products to match what customers search",
      "Check free product listings are switched on in Google Merchant Center",
    ],
    threeMonth: [
      "Run an always-on Meta Advantage+ sales campaign with several genuinely different ad concepts",
      "Build a Performance Max campaign with negative keywords and brand exclusions, launched well before your next sale",
    ],
  },
  reporting: {
    topOpportunity: "When your numbers live in five different dashboards, decisions wait until someone has time to pull them together. Connecting your tools is what makes every other automation work.",
    quickWins:  [
      "List every tool you use and where data gets re-typed between them",
      "Connect Claude to Shopify, Klaviyo and your ad accounts so it can read your real numbers",
      "Run a 20-minute Monday review of last week's ads with Claude: what to pause, keep and scale",
    ],
    threeMonth: [
      "Set up an automated weekly report covering Shopify sales, email revenue and ad results",
      "Connect your POS, Shopify and accounting (or ERP) so sales and stock data flow without manual exports",
    ],
  },
};

export function generateRecs(contact, answers) {
  const sc = calcScores(answers);
  const area = AREAS.find(a => a.id === sc.weakest);
  const timeSaved = sc.total < 10 ? "4–8 hrs/week" : sc.total < 20 ? "6–12 hrs/week" : "10–18 hrs/week";
  const recs = AREA_RECS[sc.weakest] || AREA_RECS.reporting;
  return { ...recs, timeSaved, courseModule: area ? area.module : null };
}

// ═══════════════════════════════════════════════════════════════════
// BOKO LOGO — actual brand SVG (Option_4, transparent, white-bg safe)
// viewBox covers full wordmark including b's ascender: 5750 -2679.9 12500 4447.2
// aspect ratio ≈ 2.81 : 1
// ═══════════════════════════════════════════════════════════════════
function BokoLogo({ height = 44 }) {
  const width = Math.round(height * 2.811);
  return (
    <svg
      height={height}
      width={width}
      viewBox="5750 -2679.9 12500 4447.2"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display:"block", overflow:"visible", flexShrink:0 }}
      aria-label="Boko Digital Solutions"
    >
      {/* b — very dark (#110000) */}
      <path fill="#110000" d="M7218.1-1163.5h-880.7v-1237.2c0-203.6-103-279.3-230-279.3H5750v1516.3l293.1,0.1H5750V302c0,809.2,657.3,1465.3,1468.1,1465.3s1468.1-656,1468.1-1465.3S8029-1163.5,7218.1-1163.5z M7218.2,1181.3c-486.5,0-880.8-393.6-880.8-879.3v-879.3h880.8c486.5,0,880.8,393.6,880.8,879.3C8099.1,787.5,7704.7,1181.3,7218.2,1181.3z"/>
      {/* first o — dark (#111213) */}
      <path fill="#111213" d="M11286.9,302c0-485.6-394.3-879.3-880.8-879.3c-486.5,0-880.9,393.6-880.9,879.3s394.3,879.3,880.9,879.3C10892.6,1181.1,11286.9,787.5,11286.9,302z M11874.2,302c0,809.3-657.3,1465.3-1468.1,1465.3S8938,1111.2,8938,302c0-809.3,657.3-1465.3,1468.1-1465.3C11216.9-1163.5,11874.2-507.3,11874.2,302z"/>
      {/* k / arrow — Electric Lime (#BFFC00) */}
      <path fill="#BFFC00" d="M13174.5,1181.1c-14.8,0-29.6-0.7-44.1-2.1l1927.5-1923.7l-415.3-414.4L12715.2,764.6c-1.4-14.5-2.1-29.2-2.1-44v-1884.1h-587.3V720.6c0,578.1,469.4,1046.7,1048.6,1046.7H15062v-586.2H13174.5L13174.5,1181.1z"/>
      {/* second o — dark (#111213) */}
      <path fill="#111213" d="M17662.7,302c0-485.6-394.3-879.3-880.8-879.3s-880.9,393.6-880.9,879.3s394.5,879.3,880.9,879.3C17268.4,1181.3,17662.7,787.5,17662.7,302z M18250,302c0,809.3-657.3,1465.3-1468.1,1465.3c-810.9,0-1468.1-656.1-1468.1-1465.3c0-809.3,657.3-1465.3,1468.1-1465.3C17592.7-1163.5,18250-507.3,18250,302z"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED LAYOUT
// ═══════════════════════════════════════════════════════════════════
function Shell({ children, tag = null }) {
  return (
    <div style={{ minHeight:"100vh", background:LGRAY, fontFamily:FONT }}>
      {/* Header */}
      <div style={{ background:WHITE, borderBottom:"1px solid #E5E7EB", padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <BokoLogo height={44} />
        {tag && (
          <span style={{ fontFamily:FONT, fontSize:"11px", fontWeight:700, color:GRAY, letterSpacing:"0.1em", textTransform:"uppercase" }}>{tag}</span>
        )}
      </div>
      {/* Content */}
      <div style={{ maxWidth:520, margin:"0 auto", padding:"28px 16px 60px" }}>
        {children}
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:WHITE, borderRadius:16, boxShadow:"0 2px 20px rgba(0,0,0,0.07)", padding:"28px 24px", ...style }}>
      {children}
    </div>
  );
}

function LimePill({ children }) {
  return (
    <div style={{ display:"inline-block", background:LIME, color:BLACK, fontFamily:FONT, fontWeight:700, fontSize:"12px", letterSpacing:"0.08em", textTransform:"uppercase", padding:"6px 14px", borderRadius:99, marginBottom:16 }}>
      {children}
    </div>
  );
}

function LimeButton({ children, onClick, disabled = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:"100%", padding:"17px 0", background: disabled ? "#E5E7EB" : LIME, color: disabled ? GRAY : BLACK,
        fontFamily:FONT, fontWeight:800, fontSize:"15px", letterSpacing:"0.06em", textTransform:"uppercase",
        border:"none", borderRadius:12, cursor: disabled ? "not-allowed" : "pointer", ...style }}>
      {children}
    </button>
  );
}

function LimeDot() {
  return <span style={{ display:"inline-block", width:9, height:9, background:LIME, borderRadius:"50%", flexShrink:0, marginTop:3 }} />;
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 1 — LANDING  (matches screenshot exactly)
// ═══════════════════════════════════════════════════════════════════
function Landing({ onStart }) {
  return (
    <Shell tag="AI Automation Audit">
      <Card>
        <LimePill>3-Minute Audit</LimePill>

        <h1 style={{ fontFamily:FONT, fontWeight:900, fontSize:"28px", lineHeight:1.15, color:BLACK, margin:"0 0 14px", letterSpacing:"-0.5px" }}>
          Where does your business sit on AI automation?
        </h1>

        <p style={{ fontFamily:FONT, fontSize:"15px", lineHeight:1.65, color:GRAY, margin:"0 0 20px" }}>
          10 questions on how automated your marketing really is: product content, social and ad creative, email, paid ads and reporting. You get a score out of 30 and the fastest wins for your fashion brand.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {[
            "3 minutes to complete",
            "Instant score and breakdown",
            "Free, with your results emailed to you",
          ].map(txt => (
            <div key={txt} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <LimeDot />
              <span style={{ fontFamily:FONT, fontSize:"14px", color:"#374151" }}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop:"1px solid #E5E7EB", paddingTop:22, marginBottom:26 }}>
          <p style={{ fontFamily:FONT, fontSize:"11px", fontWeight:700, color:GRAY, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 14px" }}>Areas covered</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {AREAS.map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10, background:WHITE, border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 14px" }}>
                <LimeDot />
                <span style={{ fontFamily:FONT, fontSize:"14px", fontWeight:500, color:BLACK }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        <LimeButton onClick={onStart}>Start the Audit</LimeButton>
      </Card>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 2 — CONTACT CAPTURE  (GoHighLevel lead data)
// ═══════════════════════════════════════════════════════════════════
function ContactForm({ onNext, onBack }) {
  const [form, setForm] = useState({ name: "", business: "", email: "", phone: "" });
  const [errs, setErrs] = useState({});
  const [fi, setFi] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name     = "Required";
    if (!form.business.trim()) e.business = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const inputStyle = key => ({
    width:"100%", padding:"11px 14px",
    border:`1.5px solid ${fi === key ? LIME : "#E5E7EB"}`,
    borderRadius:10, fontSize:"14px", fontFamily:FONT, color:BLACK,
    outline:"none", boxSizing:"border-box", background:"#FAFAFA"
  });

  const Label = ({ children, req }) => (
    <label style={{ display:"block", fontFamily:FONT, fontSize:"12px", fontWeight:700, color:GRAY, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>
      {children}{req && <span style={{ color:"#EF4444" }}> *</span>}
    </label>
  );

  return (
    <Shell tag="AI Automation Audit">
      <Card>
        <LimePill>Before we start</LimePill>
        <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:"22px", color:BLACK, margin:"0 0 6px", letterSpacing:"-0.3px" }}>
          Where should we send your results?
        </h2>
        <p style={{ fontFamily:FONT, fontSize:"14px", color:GRAY, margin:"0 0 24px", lineHeight:1.6 }}>
          Your personalised score and AI-powered action plan will be ready in 60 seconds.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <Label req>Your name</Label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Sarah Chen" style={inputStyle("name")}
              onFocus={() => setFi("name")} onBlur={() => setFi(null)} />
            {errs.name && <p style={{ color:"#EF4444", fontSize:"12px", margin:"4px 0 0" }}>{errs.name}</p>}
          </div>
          <div>
            <Label req>Business name</Label>
            <input value={form.business} onChange={e => set("business", e.target.value)}
              placeholder="e.g. Coastal Threads" style={inputStyle("business")}
              onFocus={() => setFi("business")} onBlur={() => setFi(null)} />
            {errs.business && <p style={{ color:"#EF4444", fontSize:"12px", margin:"4px 0 0" }}>{errs.business}</p>}
          </div>
          <div>
            <Label req>Email address</Label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="you@business.com.au" style={inputStyle("email")}
              onFocus={() => setFi("email")} onBlur={() => setFi(null)} />
            {errs.email && <p style={{ color:"#EF4444", fontSize:"12px", margin:"4px 0 0" }}>{errs.email}</p>}
          </div>
          <div>
            <Label>Phone <span style={{ textTransform:"none", fontSize:"11px", fontWeight:400 }}>(optional)</span></Label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="+61 4XX XXX XXX" style={inputStyle("phone")}
              onFocus={() => setFi("phone")} onBlur={() => setFi(null)} />
          </div>
        </div>

        <div style={{ marginTop:24 }}>
          <LimeButton onClick={() => validate() && onNext(form)}>
            Start the Audit →
          </LimeButton>
          <button onClick={onBack}
            style={{ display:"block", width:"100%", marginTop:10, padding:"12px 0", background:"none",
              border:"1.5px solid #E5E7EB", borderRadius:10, fontFamily:FONT, fontSize:"13px",
              fontWeight:600, color:GRAY, cursor:"pointer" }}>
            ← Back
          </button>
          <p style={{ fontFamily:FONT, fontSize:"11px", color:GRAY, textAlign:"center", margin:"10px 0 0" }}>
            No spam. Your results stay private. Unsubscribe anytime.
          </p>
        </div>
      </Card>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 3 — QUESTION  (reused for all 10 questions)
// ═══════════════════════════════════════════════════════════════════
function QuizScreen({ qIndex, answers, onAnswer, onNext, onBack }) {
  const q = QUESTIONS[qIndex];
  const total = QUESTIONS.length;
  const selected = answers[q.id] ?? null;
  const areaIdx = AREAS.findIndex(a => a.id === q.area);
  const area = AREAS[areaIdx];

  // Animated bar
  const [barW, setBarW] = useState(0);
  useEffect(() => { setTimeout(() => setBarW(((qIndex + 1) / total) * 100), 50); }, [qIndex]);

  return (
    <Shell>
      {/* Progress bar */}
      <div style={{ position:"sticky", top:64, zIndex:9, background:WHITE, borderBottom:"1px solid #E5E7EB", padding:"10px 20px 14px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontFamily:FONT, fontSize:"12px", color:GRAY }}>
              Question {qIndex + 1} of {total}
            </span>
            <span style={{ fontFamily:FONT, fontSize:"12px", fontWeight:600, color:BLACK }}>
              {area.label}
            </span>
          </div>
          <div style={{ height:5, background:"#E5E7EB", borderRadius:4 }}>
            <div style={{ height:"100%", width:`${barW}%`, background:LIME, borderRadius:4, transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
          {/* Section dots */}
          <div style={{ display:"flex", gap:6, marginTop:8, justifyContent:"center" }}>
            {AREAS.map((a, i) => (
              <div key={a.id} style={{ height:4, borderRadius:2, flex: i === areaIdx ? "0 0 18px" : "0 0 4px", background: i < areaIdx ? LIME : i === areaIdx ? LIME : "#E5E7EB", transition:"all 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      <Card style={{ marginTop:0 }}>
        {/* Area badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:LGRAY, borderRadius:8, padding:"5px 12px", marginBottom:16 }}>
          <span style={{ width:7, height:7, background:LIME, borderRadius:"50%", display:"inline-block" }} />
          <span style={{ fontFamily:FONT, fontSize:"11px", fontWeight:700, color:GRAY, textTransform:"uppercase", letterSpacing:"0.08em" }}>
            {area.label} · {qIndex + 1}/{total}
          </span>
        </div>

        <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:"20px", color:BLACK, margin:"0 0 22px", lineHeight:1.35, letterSpacing:"-0.3px" }}>
          {q.text}
        </h2>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {q.opts.map((opt, i) => {
            const sel = selected === opt.score;
            return (
              <label key={i} onClick={() => onAnswer(q.id, opt.score)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px",
                  border:`2px solid ${sel ? LIME : "#E5E7EB"}`,
                  background: sel ? "#F7FFD6" : WHITE,
                  borderRadius:12, cursor:"pointer", transition:"all 0.15s" }}>
                {/* Custom radio */}
                <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel ? LIME : "#D1D5DB"}`,
                  background: sel ? LIME : "transparent", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:BLACK }} />}
                </div>
                <span style={{ fontFamily:FONT, fontSize:"14px", fontWeight: sel ? 600 : 400, color: sel ? BLACK : "#374151", flex:1, lineHeight:1.45 }}>
                  {opt.text}
                </span>
              </label>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onBack}
            style={{ padding:"13px 20px", background:WHITE, border:"1.5px solid #E5E7EB", borderRadius:10,
              fontFamily:FONT, fontWeight:600, fontSize:"14px", color:GRAY, cursor:"pointer", flexShrink:0 }}>
            ← Back
          </button>
          <LimeButton onClick={onNext} disabled={selected === null} style={{ flex:1 }}>
            {qIndex === total - 1 ? "See my results →" : "Next →"}
          </LimeButton>
        </div>
      </Card>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 4 — LOADING / AI ANALYSIS
// ═══════════════════════════════════════════════════════════════════
function LoadingScreen() {
  const steps = ["Scoring your responses…", "Comparing your five marketing areas…", "Generating your action plan…"];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <Shell tag="Analysing">
      <Card style={{ textAlign:"center", padding:"52px 24px" }}>
        {/* Animated lime ring */}
        <div style={{ position:"relative", width:80, height:80, margin:"0 auto 28px" }}>
          <svg width={80} height={80} viewBox="0 0 80 80" style={{ position:"absolute", top:0, left:0 }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={LIME} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${2*Math.PI*34}`}
              strokeDashoffset={`${2*Math.PI*34 * (1 - (step+1)/4)}`}
              transform="rotate(-90 40 40)"
              style={{ transition:"stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:FONT, fontWeight:800, fontSize:"18px", color:BLACK }}>{Math.round(((step+1)/4)*100)}%</span>
          </div>
        </div>

        <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:"20px", color:BLACK, margin:"0 0 12px" }}>
          Building your action plan
        </h2>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center" }}>
              <div style={{ width:18, height:18, borderRadius:"50%",
                background: i <= step ? LIME : "#E5E7EB",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"background 0.4s", flexShrink:0 }}>
                {i <= step && <span style={{ fontSize:10 }}>✓</span>}
              </div>
              <span style={{ fontFamily:FONT, fontSize:"13px", color: i <= step ? BLACK : GRAY }}>{s}</span>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN 5 — RESULTS
// ═══════════════════════════════════════════════════════════════════
function AnimBar({ pct, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), delay + 300); return () => clearTimeout(t); }, [pct, delay]);
  const col = pct >= 67 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ height:7, background:"#F3F4F6", borderRadius:4, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, background:col, borderRadius:4, transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function ScoreRing({ total, max }) {
  const [disp, setDisp] = useState(0);
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (disp / max) * circ;

  useEffect(() => {
    let start = null;
    const fn = ts => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / 1600, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisp(Math.round(eased * total));
      if (prog < 1) requestAnimationFrame(fn);
    };
    const t = setTimeout(() => requestAnimationFrame(fn), 400);
    return () => clearTimeout(t);
  }, [total]);

  return (
    <div style={{ position:"relative", width:136, height:136 }}>
      <svg viewBox="0 0 120 120" style={{ width:136, height:136, transform:"rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F3F4F6" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={LIME} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:"stroke-dashoffset 0.04s" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:FONT, fontWeight:900, fontSize:"32px", color:BLACK, lineHeight:1 }}>{disp}</span>
        <span style={{ fontFamily:FONT, fontSize:"12px", color:GRAY }}>/ {max}</span>
      </div>
    </div>
  );
}

function RecPanel({ title, sub, items, accent }) {
  return (
    <div style={{ background:LGRAY, borderRadius:12, padding:"16px", border:`1px solid ${accent}30` }}>
      <p style={{ fontFamily:FONT, fontSize:"13px", fontWeight:700, color:accent, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{title}</p>
      <p style={{ fontFamily:FONT, fontSize:"11px", color:GRAY, margin:"0 0 12px" }}>{sub}</p>
      <ul style={{ margin:0, padding:"0 0 0 16px", display:"flex", flexDirection:"column", gap:7 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontFamily:FONT, fontSize:"13px", color:BLACK, lineHeight:1.55 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Results({ contact, answers, aiRecs, loading, onRestart }) {
  const sc = calcScores(answers);
  const areas = Object.values(sc.areas);

  const readinessColor = sc.label === "Advanced" ? "#22C55E" : sc.label === "Developing" ? "#F59E0B" : "#EF4444";
  const readinessBg    = sc.label === "Advanced" ? "#ECFDF5" : sc.label === "Developing" ? "#FFFBEB" : "#FEF2F2";

  return (
    <Shell tag="Your Results">
      <style>{`@media (max-width:560px){.boko-hero{flex-direction:column;}.boko-hero-text{text-align:center;width:100%;}.boko-cta{flex-direction:column;}.boko-cta-btn{width:100%;box-sizing:border-box;justify-content:center;}}`}</style>
      {/* Score hero */}
      <Card style={{ marginBottom:16 }}>
        <div className="boko-hero" style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap", marginBottom:20 }}>
          <ScoreRing total={sc.total} max={sc.max} />
          <div className="boko-hero-text" style={{ flex:1, minWidth:160 }}>
            <div style={{ display:"inline-block", background:readinessBg, border:`1px solid ${readinessColor}40`, borderRadius:10, padding:"8px 14px", marginBottom:8 }}>
              <p style={{ fontFamily:FONT, fontSize:"10px", fontWeight:700, color:readinessColor, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 2px" }}>Automation Readiness</p>
              <p style={{ fontFamily:FONT, fontSize:"18px", fontWeight:800, color:readinessColor, margin:0 }}>{sc.emoji} {sc.label}</p>
            </div>
            <p style={{ fontFamily:FONT, fontSize:"13px", color:GRAY, margin:0, lineHeight:1.6 }}>
              {sc.label === "Advanced"   && "Strong systems in place. You're ready for advanced AI tools and integrations."}
              {sc.label === "Developing" && "Good foundations. Targeted automation will deliver fast, measurable returns."}
              {sc.label === "Early Stage" && "Significant opportunity ahead. Quick wins now will build the foundation for full automation."}
            </p>
          </div>
        </div>

        {/* Area breakdown */}
        <h3 style={{ fontFamily:FONT, fontSize:"13px", fontWeight:700, color:GRAY, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 14px" }}>Area breakdown</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          {areas.map((a, i) => (
            <div key={a.label}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontFamily:FONT, fontSize:"13px", fontWeight:500, color:BLACK }}>{a.label}</span>
                <span style={{ fontFamily:FONT, fontSize:"12px", fontWeight:700, color:GRAY }}>{a.score}/{a.max}</span>
              </div>
              <AnimBar pct={Math.round((a.score/a.max)*100)} delay={i*80} />
            </div>
          ))}
        </div>

        {/* Priority flag */}
        <div style={{ marginTop:18, background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, padding:"13px 16px" }}>
          <p style={{ fontFamily:FONT, fontSize:"10px", fontWeight:700, color:"#C2410C", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 4px" }}>🎯 Highest ROI opportunity</p>
          <p style={{ fontFamily:FONT, fontSize:"13px", color:"#7C2D12", margin:0, lineHeight:1.55 }}>
            Lowest-scoring area: <strong>{sc.areas[sc.weakest]?.label}</strong>. Automating this first will deliver the fastest commercial return.
          </p>
        </div>
      </Card>

      {/* AI Recs */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:32, height:32, background:BLACK, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🤖</div>
          <div>
            <h2 style={{ fontFamily:FONT, fontSize:"16px", fontWeight:700, color:BLACK, margin:0 }}>
              {loading ? "Generating your action plan…" : "Your personalised action plan"}
            </h2>
            {!loading && aiRecs && <p style={{ fontFamily:FONT, fontSize:"11px", color:GRAY, margin:0 }}>Tailored to your quiz responses · Boko Digital Solutions</p>}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <div style={{ width:32, height:32, border:`3px solid #E5E7EB`, borderTopColor:LIME, borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }} />
            <p style={{ fontFamily:FONT, fontSize:"13px", color:GRAY, margin:0 }}>Analysing your responses…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && aiRecs && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {aiRecs.topOpportunity && (
              <div style={{ background:"#F0FFF0", border:`1px solid ${LIME}60`, borderRadius:10, padding:"13px 15px" }}>
                <p style={{ fontFamily:FONT, fontSize:"13px", color:BLACK, margin:0, lineHeight:1.65 }}>
                  <strong>💡 Key insight:</strong> {aiRecs.topOpportunity}
                </p>
              </div>
            )}
            {aiRecs.quickWins    && <RecPanel title="Quick wins"           sub="Implement within 30 days"  items={aiRecs.quickWins}  accent="#22C55E" />}
            {aiRecs.threeMonth   && <RecPanel title="3-month automations"  sub="Medium-term plays"         items={aiRecs.threeMonth} accent="#F59E0B" />}

            {aiRecs.timeSaved && (
              <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:14, textAlign:"center" }}>
                <p style={{ fontFamily:FONT, fontWeight:800, fontSize:"20px", color:"#059669", margin:"0 0 2px" }}>{aiRecs.timeSaved}</p>
                <p style={{ fontFamily:FONT, fontSize:"10px", color:"#065F46", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Estimated time you could save</p>
              </div>
            )}
            {aiRecs.courseModule && (
              <div style={{ background:LGRAY, border:"1px solid #E5E7EB", borderRadius:10, padding:"13px 15px" }}>
                <p style={{ fontFamily:FONT, fontSize:"13px", color:BLACK, margin:0, lineHeight:1.65 }}>
                  <strong>Where to learn it:</strong> {sc.areas[sc.weakest]?.label} is covered step by step in {aiRecs.courseModule} of the AI-Powered Fashion Accelerator.
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && !aiRecs && (
          <p style={{ fontFamily:FONT, fontSize:"13px", color:GRAY, textAlign:"center", padding:"10px 0" }}>
            Contact Boko Digital to discuss your personalised strategy.
          </p>
        )}
      </Card>

      {/* CTA */}
      <div style={{ background:BLACK, borderRadius:16, padding:24, marginBottom:16 }}>
        <h2 style={{ fontFamily:FONT, fontSize:"17px", fontWeight:700, color:WHITE, margin:"0 0 8px" }}>Recommended next step</h2>
        <p style={{ fontFamily:FONT, fontSize:"13px", color:"#F8F9FC", margin:"0 0 18px", lineHeight:1.65 }}>
          {sc.label === "Advanced"    && "You're ready for advanced AI integrations. Let's map a full automation strategy."}
          {sc.label === "Developing"  && "Target your weakest area first for the fastest ROI. Book a 30-min strategy call."}
          {sc.label === "Early Stage" && "Start with 1–2 quick wins, then build a phased automation roadmap with our team."}
        </p>
        <div className="boko-cta" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a className="boko-cta-btn" href="mailto:mariam@boko.com.au?subject=Audit Results — Strategy Call"
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:LIME, color:BLACK,
              padding:"11px 20px", borderRadius:9, textDecoration:"none", fontFamily:FONT, fontSize:"14px", fontWeight:700 }}>
            Book a strategy call
          </a>
          <a className="boko-cta-btn" href="https://boko.com.au" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.08)",
              border:"1px solid rgba(255,255,255,0.30)", color:"#F8F9FC",
              padding:"11px 20px", borderRadius:9, textDecoration:"none", fontFamily:FONT, fontSize:"14px", fontWeight:600 }}>
            boko.com.au
          </a>
        </div>
        <p style={{ fontFamily:FONT, fontSize:"11px", color:"#F8F9FC", margin:"14px 0 0" }}>Mariam · mariam@boko.com.au · boko.com.au</p>
      </div>

      <div style={{ textAlign:"center" }}>
        <button onClick={onRestart}
          style={{ background:"none", border:"1.5px solid #E5E7EB", borderRadius:9, padding:"11px 20px",
            fontFamily:FONT, fontSize:"13px", fontWeight:600, color:GRAY, cursor:"pointer" }}>
          ← Start a new audit
        </button>
      </div>
    </Shell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP — state machine
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [screen,  setScreen]  = useState("landing");   // landing | contact | quiz | loading | results
  const [qIndex,  setQIndex]  = useState(0);
  const [contact, setContact] = useState({});
  const [answers, setAnswers] = useState({});
  const [aiRecs,  setAiRecs]  = useState(null);
  const [aiLoad,  setAiLoad]  = useState(false);

  // Load Poppins
  useEffect(() => {
    if (!document.getElementById("boko-poppins")) {
      const l = document.createElement("link");
      l.id   = "boko-poppins";
      l.rel  = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const handleStart     = ()       => setScreen("contact");
  const handleContact   = (data)   => { setContact(data); setQIndex(0); setScreen("quiz"); };

  const handleAnswer    = (id, v)  => setAnswers(p => ({ ...p, [id]: v }));

  const handleNext      = async () => {
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(i => i + 1);
      window.scrollTo(0, 0);
    } else {
      // Final question — go to loading screen, generate recs, then show results
      setScreen("loading");
      window.scrollTo(0, 0);
      setAiLoad(true);
      setAiRecs(null);
      await submitLead(contact, answers);
      // Small delay so loading animation is visible, then generate instantly
      await new Promise(r => setTimeout(r, 1400));
      try { setAiRecs(generateRecs(contact, answers)); } catch (e) { console.error(e); }
      setAiLoad(false);
      setScreen("results");
      window.scrollTo(0, 0);
    }
  };

  const handleBack      = () => {
    if (qIndex > 0) { setQIndex(i => i - 1); window.scrollTo(0, 0); }
    else { setScreen("contact"); window.scrollTo(0, 0); }
  };

  const handleRestart   = () => {
    setScreen("landing"); setQIndex(0); setAnswers({}); setAiRecs(null);
    window.scrollTo(0, 0);
  };

  return (
    <>
      {screen === "landing"  && <Landing   onStart={handleStart} />}
      {screen === "contact"  && <ContactForm onNext={handleContact} onBack={() => setScreen("landing")} />}
      {screen === "quiz"     && (
        <QuizScreen qIndex={qIndex} answers={answers}
          onAnswer={handleAnswer} onNext={handleNext} onBack={handleBack} />
      )}
      {screen === "loading"  && <LoadingScreen />}
      {screen === "results"  && (
        <Results contact={contact} answers={answers}
          aiRecs={aiRecs} loading={aiLoad} onRestart={handleRestart} />
      )}

    </>
  );
}
