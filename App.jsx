import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// HUBSPOT CONFIG
// Replace these two values with your own from HubSpot
// Dashboard → Marketing → Forms → [your form] → Embed → iframe src
// ═══════════════════════════════════════════════════════════════════
const HS_PORTAL_ID = "8173960";   // Boko HubSpot portal
const HS_FORM_GUID = "31a9c609-ab93-4d80-8231-8aa50a945416";   // AI Automation Audit form

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
// QUIZ DATA  — 10 questions across 5 AU fashion retail areas
// ═══════════════════════════════════════════════════════════════════
export const AREAS = [
  { id: "inventory", label: "Inventory & demand" },
  { id: "customer",  label: "Customer experience" },
  { id: "pricing",   label: "Pricing & margin" },
  { id: "workforce", label: "Workforce & scheduling" },
  { id: "data",      label: "Data & tech readiness" },
];

const QUESTIONS = [
  // ── Inventory & demand ────────────────────────────────────────
  { id: 1, area: "inventory",
    text: "How do you currently forecast demand and plan stock levels?",
    opts: [
      { text: "Gut feel or past experience",              score: 0 },
      { text: "Manual review of sales reports",           score: 1 },
      { text: "Spreadsheet models with historical data",  score: 2 },
      { text: "Automated forecasting software",           score: 3 },
    ]},
  { id: 2, area: "inventory",
    text: "How quickly can you identify a stockout or overstock problem?",
    opts: [
      { text: "Only when customers or staff flag it",     score: 0 },
      { text: "Through weekly stock counts",              score: 1 },
      { text: "Daily reports from our POS / system",      score: 2 },
      { text: "Real-time alerts and dashboards",          score: 3 },
    ]},
  // ── Customer experience ───────────────────────────────────────
  { id: 3, area: "customer",
    text: "How do you personalise the experience for repeat customers?",
    opts: [
      { text: "We treat all customers the same",                   score: 0 },
      { text: "Staff remember regulars informally",                score: 1 },
      { text: "Segment by purchase history in our CRM",           score: 2 },
      { text: "Automated personalisation across all channels",     score: 3 },
    ]},
  { id: 4, area: "customer",
    text: "How are post-purchase follow-ups and loyalty managed?",
    opts: [
      { text: "No formal follow-up process",                          score: 0 },
      { text: "Manual email or SMS to customers",                     score: 1 },
      { text: "Basic loyalty program (stamps / points)",             score: 2 },
      { text: "Automated flows with personalised messaging",          score: 3 },
    ]},
  // ── Pricing & margin ──────────────────────────────────────────
  { id: 5, area: "pricing",
    text: "How do you set and adjust prices across your range?",
    opts: [
      { text: "Fixed pricing set once per season",               score: 0 },
      { text: "Ad-hoc adjustments based on feel",                score: 1 },
      { text: "Regular reviews using sales data",                score: 2 },
      { text: "Dynamic pricing with margin-aware rules",         score: 3 },
    ]},
  { id: 6, area: "pricing",
    text: "How do you handle markdowns and end-of-season clearance?",
    opts: [
      { text: "Decide last minute when stock piles up",             score: 0 },
      { text: "Fixed markdown schedule, set manually",              score: 1 },
      { text: "Data-informed decisions each cycle",                 score: 2 },
      { text: "Automated triggers based on sell-through rate",      score: 3 },
    ]},
  // ── Workforce & scheduling ────────────────────────────────────
  { id: 7, area: "workforce",
    text: "How do you build your staff roster each week?",
    opts: [
      { text: "Manually, based on manager judgement",                    score: 0 },
      { text: "Spreadsheet with fixed patterns",                         score: 1 },
      { text: "Software that factors in sales forecasts",                score: 2 },
      { text: "AI-optimised scheduling linked to foot traffic data",     score: 3 },
    ]},
  { id: 8, area: "workforce",
    text: "How do you manage last-minute staff changes or no-shows?",
    opts: [
      { text: "Manual phone calls to find cover",                score: 0 },
      { text: "WhatsApp group to find available staff",          score: 1 },
      { text: "App with shift-swap features",                    score: 2 },
      { text: "Automated alerts and self-service swap system",   score: 3 },
    ]},
  // ── Data & tech readiness ─────────────────────────────────────
  { id: 9, area: "data",
    text: "How connected are your core systems — POS, e-com, inventory, accounting?",
    opts: [
      { text: "All separate — no integration",                       score: 0 },
      { text: "Manual data transfer between systems",                score: 1 },
      { text: "Some integrations in place",                          score: 2 },
      { text: "Fully integrated with real-time data sync",           score: 3 },
    ]},
  { id: 10, area: "data",
    text: "How central is data to your day-to-day business decisions?",
    opts: [
      { text: "Mostly intuition — we don't track much",       score: 0 },
      { text: "Basic reports reviewed occasionally",          score: 1 },
      { text: "Dashboards guide key decisions",               score: 2 },
      { text: "Data is central to every strategic call",      score: 3 },
    ]},
];

// ═══════════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════════
function calcScores(answers) {
  const areas = {};
  AREAS.forEach(({ id, label }) => {
    const qs = QUESTIONS.filter(q => q.area === id);
    const score = qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
    areas[id] = { score, max: qs.length * 3, label };
  });
  const total = Object.values(areas).reduce((s, a) => s + a.score, 0);
  const max = 30;
  const pct = Math.round((total / max) * 100);
  const label = total <= 10 ? "Early Stage" : total <= 20 ? "Developing" : "Advanced";
  const emoji = total <= 10 ? "🔴" : total <= 20 ? "🟡" : "🟢";
  const weakest = Object.entries(areas).sort(([,a],[,b]) => (a.score/a.max)-(b.score/b.max))[0][0];
  return { total, max, pct, areas, label, emoji, weakest };
}

// ═══════════════════════════════════════════════════════════════════
// HUBSPOT FORM SUBMISSION
// ═══════════════════════════════════════════════════════════════════
async function submitToHubSpot(contact, answers) {
  if (HS_PORTAL_ID === "YOUR_PORTAL_ID") return; // not configured yet
  const sc = calcScores(answers);
  const fields = [
    { name: "firstname",               value: contact.name.split(" ")[0] || contact.name },
    { name: "lastname",                value: contact.name.split(" ").slice(1).join(" ") || "" },
    { name: "email",                   value: contact.email },
    { name: "phone",                   value: contact.phone || "" },
    { name: "company",                 value: contact.business || "" },
    // Custom properties — create these in HubSpot first (see README section below)
    { name: "ai_audit_total_score",    value: String(sc.total) },
    { name: "ai_audit_readiness",      value: sc.label },
    { name: "ai_audit_inventory",      value: String(sc.areas.inventory.score) },
    { name: "ai_audit_customer",       value: String(sc.areas.customer.score) },
    { name: "ai_audit_pricing",        value: String(sc.areas.pricing.score) },
    { name: "ai_audit_workforce",      value: String(sc.areas.workforce.score) },
    { name: "ai_audit_data",           value: String(sc.areas.data.score) },
  ];
  try {
    await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HS_PORTAL_ID}/${HS_FORM_GUID}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, context: { pageUri: typeof window !== "undefined" ? window.location.href : "" } }) }
    );
  } catch (e) { console.warn("HubSpot submission error:", e); }
}

// ═══════════════════════════════════════════════════════════════════
// SMART RECOMMENDATIONS  (score-based, no API call needed)
// ═══════════════════════════════════════════════════════════════════
function generateRecs(contact, answers) {
  const sc = calcScores(answers);
  const areaRecs = {
    inventory: {
      topOpportunity: "Your inventory processes have the highest automation ROI — real-time stock visibility and demand forecasting can cut overstock costs by 20–30%.",
      quickWins:  ["Set up automated low-stock alerts in your POS or inventory system this week","Connect your POS to a free inventory tool (Shopify, DEAR, or Cin7 trial) to centralise data","Build a simple reorder-point spreadsheet for your top 30 SKUs"],
      threeMonth: ["Integrate supplier portals to automate purchase orders when stock hits reorder points","Implement AI demand forecasting to predict seasonal stock needs 6 weeks ahead"]
    },
    customer: {
      topOpportunity: "Customer retention is your fastest revenue lever — automated loyalty and post-purchase sequences typically deliver 15–25% repeat purchase uplift.",
      quickWins:  ["Launch a simple points loyalty program via Smile.io or Yotpo (free tier)","Set up a 3-email post-purchase sequence: thank you → review request → product tip","Create 3 customer segments in Klaviyo: new, repeat, and lapsed 90+ days"],
      threeMonth: ["Build an automated win-back flow for customers inactive for 60+ days","Implement personalised product recommendation emails based on purchase history"]
    },
    pricing: {
      topOpportunity: "Smarter pricing and markdown automation can recover 10–15% margin leakage across your range each season.",
      quickWins:  ["Build a simple markdown calendar in Google Sheets tied to your sell-through targets","Review and update your top 20 SKU prices against competitor benchmarks this week","Set up weekly automated sell-through reports from your POS or Shopify"],
      threeMonth: ["Implement automated markdown triggers based on sell-through rate thresholds","Connect your pricing tool to real-time competitor data for dynamic adjustments"]
    },
    workforce: {
      topOpportunity: "Workforce scheduling optimisation is typically worth 6–10 hours of admin saved per week for fashion retail teams.",
      quickWins:  ["Switch from spreadsheet rostering to Deputy or Humanforce (free trial available)","Create a shared availability calendar so staff can update their own availability","Set up automated shift reminder SMS/emails to reduce no-shows"],
      threeMonth: ["Implement AI-optimised scheduling that factors in foot traffic and sales forecasts","Build a self-service shift-swap system so staff manage cover without manager involvement"]
    },
    data: {
      topOpportunity: "Connecting your core systems (POS, e-com, accounting) is the single change that unlocks every other automation in your business.",
      quickWins:  ["Map your current tech stack and identify the top 3 data gaps this week","Connect your POS to Xero or MYOB using a free Zapier integration","Set up a weekly automated sales summary email from your POS or Shopify"],
      threeMonth: ["Build a core integration layer connecting POS, e-com, and accounting in real-time","Create a single dashboard showing sales, inventory, and margin KPIs in one view"]
    }
  };

  const timeSaved   = sc.total <= 10 ? "4–8 hrs/week"  : sc.total <= 20 ? "6–12 hrs/week" : "10–18 hrs/week";
  const revenueLift = sc.total <= 10 ? "$2,000–$5,000/month" : sc.total <= 20 ? "$4,000–$10,000/month" : "$8,000–$20,000/month";
  const benchmark   = "Australian fashion retailers investing in AI automation now are seeing 18–28% revenue uplift within 12 months — the window for first-mover advantage is closing fast.";

  const recs = areaRecs[sc.weakest] || areaRecs.data;
  return { ...recs, timeSaved, revenueLift, benchmark };
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
          10 questions that benchmark your operations against where the Australian fashion market is heading — and surface the fastest commercial returns available to your business right now.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {[
            "3 minutes to complete",
            "Instant score and breakdown",
            "No sign-up required",
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
// SCREEN 2 — CONTACT CAPTURE  (HubSpot lead data)
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
  const steps = ["Scoring your responses…", "Benchmarking against AU fashion market…", "Generating your action plan…"];
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
      <style>{`@media (max-width:560px){.boko-hero{flex-direction:column;}.boko-hero-text{text-align:center;width:100%;}.boko-cta{flex-direction:column;}.boko-cta-btn{width:100%;justify-content:center;}}`}</style>
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
            {aiRecs.benchmark && (
              <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"13px 15px" }}>
                <p style={{ fontFamily:FONT, fontSize:"12px", color:"#1E40AF", margin:0, lineHeight:1.65 }}>
                  <strong>📊 Market context:</strong> {aiRecs.benchmark}
                </p>
              </div>
            )}
            {aiRecs.quickWins    && <RecPanel title="Quick wins"           sub="Implement within 30 days"  items={aiRecs.quickWins}  accent="#22C55E" />}
            {aiRecs.threeMonth   && <RecPanel title="3-month automations"  sub="Medium-term plays"         items={aiRecs.threeMonth} accent="#F59E0B" />}

            {(aiRecs.timeSaved || aiRecs.revenueLift) && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                {aiRecs.timeSaved && (
                  <div style={{ flex:"1 1 200px", background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:14, textAlign:"center" }}>
                    <p style={{ fontFamily:FONT, fontWeight:800, fontSize:"20px", color:"#059669", margin:"0 0 2px" }}>{aiRecs.timeSaved}</p>
                    <p style={{ fontFamily:FONT, fontSize:"10px", color:"#065F46", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Time saved/week</p>
                  </div>
                )}
                {aiRecs.revenueLift && (
                  <div style={{ flex:"1 1 200px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:14, textAlign:"center" }}>
                    <p style={{ fontFamily:FONT, fontWeight:800, fontSize:"20px", color:"#1D4ED8", margin:"0 0 2px" }}>{aiRecs.revenueLift}</p>
                    <p style={{ fontFamily:FONT, fontSize:"10px", color:"#1E3A8A", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Revenue uplift/month</p>
                  </div>
                )}
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
      await submitToHubSpot(contact, answers);
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
