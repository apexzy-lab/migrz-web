"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type View = "home" | "assessment" | "documents" | "payment" | "help";

const navItems: { id: View; label: string; symbol: string }[] = [
  { id: "home", label: "Home", symbol: "H" },
  { id: "assessment", label: "My assessment", symbol: "A" },
  { id: "documents", label: "Documents", symbol: "D" },
  { id: "payment", label: "Payment", symbol: "P" },
  { id: "help", label: "Help", symbol: "?" },
];

const steps = [
  { number: "1", title: "About you", status: "Complete", tone: "complete" },
  { number: "2", title: "Career & evidence", status: "In progress", tone: "current" },
  { number: "3", title: "Review your answers", status: "Not started", tone: "future" },
  { number: "4", title: "Choose plan & pay", status: "Locked", tone: "locked" },
];

function Arrow() { return <span aria-hidden="true">→</span>; }

type PortalSession = { loaded: boolean; authenticated: boolean; user: null | { email: string; countryResidence: string; preferredPlan: "standard" | "accelerated"; paid: boolean; paidPlan: "standard" | "accelerated" | null }; integrations: { email: boolean; paystack: boolean; paypal: boolean } };

export function PortalClient() {
  const [session, setSession] = useState<PortalSession>({ loaded: false, authenticated: false, user: null, integrations: { email: false, paystack: false, paypal: false } });
  const refresh = async () => { try { const response = await fetch("/api/portal/session", { cache: "no-store" }); const data = await response.json() as Omit<PortalSession, "loaded">; setSession({ loaded: true, ...data }); } catch { setSession((current) => ({ ...current, loaded: true })); } };
  // The initial secure-session read resolves into client state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);
  if (!session.loaded) return <PortalLoading />;
  if (!session.authenticated || !session.user) return <PortalAccess integrations={session.integrations} onVerified={refresh} />;
  if (!session.user.paid) return <PortalCheckout user={session.user} integrations={session.integrations} onSignOut={async () => { await fetch("/api/portal/session", { method: "DELETE" }); await refresh(); }} />;
  return <PaidPortal user={session.user} onSignOut={async () => { await fetch("/api/portal/session", { method: "DELETE" }); await refresh(); }} />;
}

function PortalLoading() {
  return <div className="portal-gate"><div className="portal-gate-card portal-loading"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /><span>Checking secure access…</span></div></div>;
}

function PortalAccess({ integrations, onVerified }: { integrations: PortalSession["integrations"]; onVerified: () => Promise<void> }) {
  const [stage, setStage] = useState<"details" | "code">("details"); const [email, setEmail] = useState(""); const [country, setCountry] = useState("NG"); const [plan, setPlan] = useState<"standard" | "accelerated">("standard"); const [code, setCode] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const requestCode = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); const response = await fetch("/api/portal/auth/request-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, countryResidence: country, plan }) }); const data = await response.json() as { error?: string }; setBusy(false); if (!response.ok) return setMessage(data.error || "Unable to send the code."); setStage("code"); };
  const verifyCode = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setMessage(""); const response = await fetch("/api/portal/auth/verify-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code }) }); const data = await response.json() as { error?: string }; setBusy(false); if (!response.ok) return setMessage(data.error || "Unable to verify the code."); await onVerified(); };
  // These policy links intentionally remain on the same Worker host.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <div className="portal-gate"><aside className="portal-gate-brand"><Link href="/"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></Link><div><span>Professional pathway assessment</span><h1>Clarity before an immigration decision.</h1><p>Choose your assessment, pay securely, then complete your professional record for human review by Migrz.</p></div><small>Assessment does not guarantee eligibility or approval.</small></aside><main className="portal-gate-main"><div className="portal-gate-card"><span className="portal-eyebrow">{stage === "details" ? "Start securely" : "Verify your email"}</span><h2>{stage === "details" ? "Create your assessment access." : "Enter the six-digit code."}</h2><p>{stage === "details" ? "We use your country of residence to route you to the available payment provider." : `We sent a one-time code to ${email}. It expires in 10 minutes.`}</p>{stage === "details" ? <form onSubmit={requestCode}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Country of residence<select value={country} onChange={(event) => setCountry(event.target.value)}><option value="NG">Nigeria</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AE">United Arab Emirates</option><option value="DE">Germany</option><option value="AU">Australia</option><option value="OT">Other country</option></select></label><fieldset><legend>Choose an assessment</legend><button type="button" className={plan === "standard" ? "is-selected" : ""} onClick={() => setPlan("standard")}><strong>Standard</strong><span>$350</span><small>Written report with a 48-hour target</small></button><button type="button" className={plan === "accelerated" ? "is-selected" : ""} onClick={() => setPlan("accelerated")}><strong>Accelerated</strong><span>$550</span><small>Same business day before 12 PM WAT</small></button></fieldset><div className="portal-provider-line"><span>Payment provider</span><strong>{country === "NG" ? "Paystack" : "PayPal"}</strong></div><button className="portal-primary" disabled={busy || !integrations.email}>{busy ? "Sending code…" : "Email me a secure code"}<Arrow /></button></form> : <form onSubmit={verifyCode}><label>Six-digit code<input className="portal-code-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" required /></label><button className="portal-primary" disabled={busy}>{busy ? "Checking…" : "Verify and continue"}<Arrow /></button><button type="button" className="portal-link-button" onClick={() => setStage("details")}>Use a different email</button></form>}{message && <p className="portal-form-message" role="alert">{message}</p>}{!integrations.email && <p className="portal-setup-message">Email sign-in is waiting for the ZeptoMail token and session secret.</p>}<small className="portal-gate-legal">By continuing, you agree to the Migrz <a href="/terms">terms</a> and acknowledge the <a href="/privacy">privacy notice</a>.</small></div></main></div>;
}

function PortalCheckout({ user, integrations, onSignOut }: { user: NonNullable<PortalSession["user"]>; integrations: PortalSession["integrations"]; onSignOut: () => Promise<void> }) {
  const [plan, setPlan] = useState(user.preferredPlan); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const provider = user.countryResidence === "NG" ? "Paystack" : "PayPal"; const configured = provider === "Paystack" ? integrations.paystack : integrations.paypal;
  const checkout = async () => { setBusy(true); setMessage(""); const response = await fetch("/api/portal/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) }); const data = await response.json() as { error?: string; checkoutUrl?: string }; if (!response.ok || !data.checkoutUrl) { setBusy(false); return setMessage(data.error || "Unable to start checkout."); } window.location.assign(data.checkoutUrl); };
  return <div className="portal-gate"><aside className="portal-gate-brand"><Link href="/"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></Link><div><span>Payment before assessment</span><h1>Choose the review pace that fits your decision.</h1><p>Payment unlocks the assessment workspace. Your answers and documents are collected only after payment is verified.</p></div><small>No immigration outcome is guaranteed.</small></aside><main className="portal-gate-main"><div className="portal-gate-card"><span className="portal-eyebrow">Secure checkout</span><h2>Select your assessment.</h2><p>Signed in as {user.email}. Your residence routes payment through <strong>{provider}</strong>.</p><div className="portal-plan-list"><button className={plan === "standard" ? "is-selected" : ""} onClick={() => setPlan("standard")}><span><strong>Standard assessment</strong><small>Written pathway report · 48-hour target</small></span><b>$350</b></button><button className={plan === "accelerated" ? "is-selected" : ""} onClick={() => setPlan("accelerated")}><span><strong>Accelerated assessment</strong><small>Same business day before 12 PM WAT; otherwise next business day</small></span><b>$550</b></button></div><div className="portal-checkout-summary"><span>Due today</span><strong>${plan === "standard" ? "350" : "550"} USD</strong></div><button className="portal-primary" onClick={checkout} disabled={busy || !configured}>{busy ? "Opening checkout…" : `Continue with ${provider}`}<Arrow /></button>{message && <p className="portal-form-message" role="alert">{message}</p>}{!configured && <p className="portal-setup-message">{provider} checkout is waiting for its production credentials.</p>}<button className="portal-link-button" onClick={() => void onSignOut()}>Sign out or change country</button></div></main></div>;
}

function PaidPortal({ user, onSignOut }: { user: { email: string; paidPlan: "standard" | "accelerated" | null }; onSignOut: () => Promise<void> }) {
  const [view, setView] = useState<View>("home");
  const [mobileMenu, setMobileMenu] = useState(false);

  const selectView = (next: View) => {
    setView(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <div className="portal-shell">
    <aside className={`portal-sidebar ${mobileMenu ? "is-open" : ""}`} aria-label="Applicant portal navigation">
      <div className="portal-brand-row">
        <Link href="/" className="portal-logo" aria-label="Migrz home"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></Link>
        <button className="portal-menu-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation">×</button>
      </div>
      <nav className="portal-main-nav">
        {navItems.map((item) => <button key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => selectView(item.id)} aria-current={view === item.id ? "page" : undefined}><span aria-hidden="true">{item.symbol}</span>{item.label}</button>)}
      </nav>
      <div className="portal-private-note"><span aria-hidden="true">⌑</span><p><strong>Private workspace.</strong> Documents are stored separately and access is tied to your verified account.</p></div>
      <Link className="portal-back-site" href="/">Back to migrzz.com <Arrow /></Link>
    </aside>

    {mobileMenu && <button className="portal-menu-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

    <div className="portal-app">
      <div className="portal-preview-bar"><strong>{user.paidPlan === "accelerated" ? "Accelerated" : "Standard"} assessment</strong><span>Payment verified · your assessment workspace is active.</span></div>
      <header className="portal-topbar">
        <button className="portal-menu-open" onClick={() => setMobileMenu(true)} aria-label="Open navigation">☰</button>
        <div className="portal-mobile-logo"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></div>
        <p><span className="portal-avatar" aria-hidden="true">A</span>{user.email}</p>
        <div><button className="portal-text-button" onClick={() => selectView("help")}>Need help?</button><button className="portal-account" onClick={() => void onSignOut()} aria-label="Sign out">Out</button></div>
      </header>

      <main className="portal-main" id="main">
        {view === "home" && <Dashboard onContinue={() => selectView("assessment")} onHelp={() => selectView("help")} />}
        {view === "assessment" && <Assessment />}
        {view === "documents" && <Documents />}
        {view === "payment" && <Payment />}
        {view === "help" && <Help />}
      </main>
    </div>

    <nav className="portal-mobile-nav" aria-label="Mobile applicant portal navigation">
      {navItems.map((item) => <button key={item.id} className={view === item.id ? "is-active" : ""} onClick={() => selectView(item.id)}><span>{item.symbol}</span>{item.label.replace("My ", "")}</button>)}
    </nav>
  </div>;
}

function Dashboard({ onContinue, onHelp }: { onContinue: () => void; onHelp: () => void }) {
  return <div className="portal-dashboard">
    <section className="portal-welcome">
      <div><span className="portal-eyebrow">Your Migrz assessment</span><h1>Complete your<br /><em>professional assessment.</em></h1><p>Tell us about your background and achievements so our team can assess the immigration pathways that may fit your record.</p><button className="portal-primary" onClick={onContinue}>Continue assessment <Arrow /></button></div>
      <div className="portal-progress-orbit" aria-label="46 percent complete"><strong>46%</strong><span>Overall progress</span></div>
    </section>

    <Journey />

    <div className="portal-dashboard-grid">
      <section className="portal-continue-card">
        <span className="portal-eyebrow">Continue where you left off</span>
        <div className="portal-task-title"><span aria-hidden="true">02</span><div><strong>Career & evidence</strong><p>Build a clear record of your experience, achievements and professional impact.</p></div></div>
        <div className="portal-task-meta"><span>About 18 minutes remaining</span><span>12 of 20 questions answered</span></div>
        <div className="portal-task-progress" aria-label="60 percent of this section complete"><i /></div>
        <button className="portal-primary" onClick={onContinue}>Continue assessment <Arrow /></button>
      </section>

      <section className="portal-after-payment">
        <span className="portal-eyebrow">Clear from the beginning</span><h2>What happens after payment?</h2>
        <ol><li><span>1</span><p><strong>Migrz reviews your profile</strong><small>A person reviews your record—not an automated eligibility score.</small></p></li><li><span>2</span><p><strong>You receive a written pathway report</strong><small>Possible routes, evidence gaps, limitations and recommended next steps.</small></p></li><li><span>3</span><p><strong>You decide whether to engage us</strong><small>The assessment does not commit you to full application support.</small></p></li></ol>
      </section>

      <section className="portal-support-card">
        <span className="portal-support-avatar" aria-hidden="true">M</span><div><span className="portal-eyebrow">Real human support</span><h2>Need help? We’re here for you.</h2><p>Ask the Migrz assessment team about a question, document or payment step.</p></div><button onClick={onHelp}>Contact support <Arrow /></button>
      </section>
    </div>
  </div>;
}

function Journey() {
  return <section className="portal-journey" aria-label="Assessment progress">
    {steps.map((step, index) => <div key={step.number} className={`portal-step is-${step.tone}`}><span>{step.tone === "complete" ? "✓" : step.number}</span><p><strong>{step.title}</strong><small>{step.status}</small></p>{index < steps.length - 1 && <i aria-hidden="true" />}</div>)}
  </section>;
}

function AssessmentPreview() {
  const [section, setSection] = useState(1);
  const sectionData = [
    { title: "About you", copy: "Confirm the personal details that help us understand your circumstances and timing." },
    { title: "Career & evidence", copy: "Tell us what you have done, how your work mattered and what can verify it." },
    { title: "Review your answers", copy: "Check your information before selecting and paying for an assessment plan." },
    { title: "Choose plan & pay", copy: "This step unlocks after the required assessment questions are complete." },
  ];
  const current = sectionData[section - 1];
  return <div className="portal-subpage">
    <header><span className="portal-eyebrow">My assessment</span><h1>{current.title}</h1><p>{current.copy}</p></header>
    <Journey />
    <div className="portal-form-layout">
      <aside><strong>Career & evidence</strong><p>12 of 20 questions answered</p><div><i /></div><small>About 18 minutes remaining</small></aside>
      <form onSubmit={(event) => { event.preventDefault(); setSection(Math.min(4, section + 1)); }}>
        {section === 1 && <><label>Full legal name<input placeholder="As shown on your passport" /></label><label>Current country of residence<select defaultValue=""><option value="" disabled>Select a country</option><option>Nigeria</option><option>United Kingdom</option><option>Canada</option><option>United States</option><option>Other</option></select></label><label>Primary immigration goal<textarea placeholder="Tell us where you hope to move and why." /></label></>}
        {section === 2 && <><label>Current professional role<input placeholder="Role or title" /></label><label>Years of relevant experience<select defaultValue=""><option value="" disabled>Select a range</option><option>Less than 3 years</option><option>3–5 years</option><option>6–10 years</option><option>More than 10 years</option></select></label><label>Most important professional achievement<textarea placeholder="What changed because of your work? Include measurable evidence where possible." /></label></>}
        {section === 3 && <div className="portal-review-box"><strong>Your answers are not submitted yet.</strong><p>Review each section carefully. Migrz will assess the information only after you choose a plan, complete payment and submit the assessment.</p><button type="button" onClick={() => setSection(1)}>Review from the beginning</button></div>}
        {section === 4 && <div className="portal-review-box is-locked"><strong>Payment remains locked in this preview.</strong><p>The production portal will display the confirmed assessment plans, scope and delivery target before you pay.</p></div>}
        <footer><span>Preview only · nothing is submitted</span><button className="portal-primary" type="submit">Save & continue <Arrow /></button></footer>
      </form>
    </div>
  </div>;
}

function DocumentsPreview() {
  const [files, setFiles] = useState<string[]>([]);
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Documents</span><h1>Keep supporting evidence organised.</h1><p>Documents help a reviewer understand and verify your record. Upload only when secure storage is activated.</p></header><div className="portal-document-layout"><section className="portal-upload-zone"><span aria-hidden="true">↑</span><h2>Add a supporting document</h2><p>Preview mode only. Selected files stay on your device and are not uploaded.</p><label>Choose a file<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { const name = event.target.files?.[0]?.name; if (name) setFiles((current) => [...current, name]); }} /></label></section><section className="portal-file-list"><span className="portal-eyebrow">Selected on this device</span>{files.length ? files.map((file) => <div key={file}><span>DOC</span><strong>{file}</strong><button onClick={() => setFiles((current) => current.filter((name) => name !== file))}>Remove</button></div>) : <p>No documents selected.</p>}</section></div></div>;
}

function PaymentPreview() {
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Payment</span><h1>Know exactly what you are paying for.</h1><p>Payment will become available after the required information is complete and the assessment plans have been confirmed.</p></header><section className="portal-payment-lock"><span aria-hidden="true">⌑</span><div><strong>Complete your assessment first</strong><p>Finish Career & evidence, review your answers, then choose a plan. The checkout will show the exact price, included deliverables and delivery target before payment.</p></div><button disabled>Checkout locked</button></section></div>;
}

type AssessmentAnswers = { fullName: string; countryResidence: string; immigrationGoal: string; currentRole: string; experienceRange: string; achievement: string };
const emptyAnswers: AssessmentAnswers = { fullName: "", countryResidence: "", immigrationGoal: "", currentRole: "", experienceRange: "", achievement: "" };

function Assessment() {
  const [section, setSection] = useState(1); const [answers, setAnswers] = useState<AssessmentAnswers>(emptyAnswers); const [message, setMessage] = useState("Loading your saved assessment…"); const [busy, setBusy] = useState(false); const sectionData = [{ title: "About you", copy: "Confirm the personal details that help us understand your circumstances and timing." }, { title: "Career & evidence", copy: "Tell us what you have done, how your work mattered and what can verify it." }, { title: "Review your answers", copy: "Check your information before submitting it to the Migrz assessment team." }, { title: "Submit assessment", copy: "Submit your completed record for professional review." }];
  useEffect(() => { void (async () => { const response = await fetch("/api/portal/application", { cache: "no-store" }); const data = await response.json() as { application?: { currentSection?: number; answers?: Partial<AssessmentAnswers>; status?: string } }; if (response.ok && data.application) { setSection(Math.min(4, data.application.currentSection || 1)); setAnswers({ ...emptyAnswers, ...data.application.answers }); setMessage(data.application.status === "submitted" ? "Assessment submitted." : "All changes are stored securely."); } else setMessage("Start with the questions below."); })(); }, []);
  const update = (field: keyof AssessmentAnswers, value: string) => setAnswers((current) => ({ ...current, [field]: value }));
  const save = async (nextSection: number) => { setBusy(true); setMessage("Saving…"); const response = await fetch("/api/portal/application", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentSection: nextSection, answers }) }); const data = await response.json() as { error?: string }; setBusy(false); if (!response.ok) return setMessage(data.error || "Unable to save."); setMessage("All changes saved."); setSection(nextSection); };
  const submit = async () => { setBusy(true); setMessage("Submitting…"); const saved = await fetch("/api/portal/application", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentSection: 4, answers }) }); if (!saved.ok) { const data = await saved.json() as { error?: string }; setBusy(false); return setMessage(data.error || "Unable to save."); } const response = await fetch("/api/portal/application", { method: "POST" }); const data = await response.json() as { error?: string }; setBusy(false); setMessage(response.ok ? "Assessment submitted to Migrz." : data.error || "Unable to submit."); };
  const current = sectionData[section - 1];
  return <div className="portal-subpage"><header><span className="portal-eyebrow">My assessment</span><h1>{current.title}</h1><p>{current.copy}</p></header><Journey /><div className="portal-form-layout"><aside><strong>Paid assessment</strong><p>Your draft is saved to your secure account.</p><div><i style={{ width: `${section * 25}%` }} /></div><small>Step {section} of 4</small></aside><form onSubmit={(event) => { event.preventDefault(); if (section === 4) void submit(); else void save(Math.min(4, section + 1)); }}>
    {section === 1 && <><label>Full legal name<input value={answers.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="As shown on your passport" required /></label><label>Current country of residence<input value={answers.countryResidence} onChange={(event) => update("countryResidence", event.target.value)} placeholder="Country" required /></label><label>Primary immigration goal<textarea value={answers.immigrationGoal} onChange={(event) => update("immigrationGoal", event.target.value)} placeholder="Tell us where you hope to move and why." required /></label></>}
    {section === 2 && <><label>Current professional role<input value={answers.currentRole} onChange={(event) => update("currentRole", event.target.value)} placeholder="Role or title" required /></label><label>Years of relevant experience<select value={answers.experienceRange} onChange={(event) => update("experienceRange", event.target.value)} required><option value="" disabled>Select a range</option><option>Less than 3 years</option><option>3–5 years</option><option>6–10 years</option><option>More than 10 years</option></select></label><label>Most important professional achievement<textarea value={answers.achievement} onChange={(event) => update("achievement", event.target.value)} placeholder="What changed because of your work? Include measurable evidence where possible." required /></label></>}
    {section === 3 && <div className="portal-review-box"><strong>Review your professional record.</strong><p><b>{answers.fullName || "Name not added"}</b><br />{answers.currentRole || "Role not added"} · {answers.experienceRange || "Experience not added"}</p><p>{answers.immigrationGoal || "Immigration goal not added"}</p><p>{answers.achievement || "Achievement not added"}</p><button type="button" onClick={() => setSection(1)}>Edit your answers</button></div>}
    {section === 4 && <div className="portal-review-box"><strong>Ready for professional review?</strong><p>Submitting sends your completed record to Migrz. You can still add documents before the assessment team begins its review.</p></div>}
    <footer><span aria-live="polite">{message}</span><button className="portal-primary" type="submit" disabled={busy}>{busy ? "Working…" : section === 4 ? "Submit assessment" : "Save & continue"}<Arrow /></button></footer>
  </form></div></div>;
}

type StoredDocument = { id: string; fileName: string; contentType: string; size: number; status: string };
function Documents() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]); const [message, setMessage] = useState("Loading documents…"); const [busy, setBusy] = useState(false);
  const load = async () => { const response = await fetch("/api/portal/documents", { cache: "no-store" }); const data = await response.json() as { documents?: StoredDocument[] }; if (response.ok) { setDocuments(data.documents || []); setMessage((data.documents || []).length ? "Documents are stored privately." : "No documents uploaded yet."); } else setMessage("Unable to load documents."); };
  // The initial private-document read resolves into this view's client state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const upload = async (file?: File) => { if (!file) return; setBusy(true); setMessage("Uploading securely…"); const form = new FormData(); form.append("file", file); const response = await fetch("/api/portal/documents", { method: "POST", body: form }); const data = await response.json() as { error?: string }; setBusy(false); if (!response.ok) return setMessage(data.error || "Unable to upload."); await load(); };
  const remove = async (id: string) => { setBusy(true); const response = await fetch(`/api/portal/documents?id=${encodeURIComponent(id)}`, { method: "DELETE" }); setBusy(false); if (response.ok) await load(); else setMessage("Unable to remove the document."); };
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Documents</span><h1>Keep supporting evidence organised.</h1><p>Upload only documents relevant to the claims in your assessment. Files are private and limited to PDF, JPG or PNG up to 10 MB.</p></header><div className="portal-document-layout"><section className="portal-upload-zone"><span aria-hidden="true">↑</span><h2>Add a supporting document</h2><p>Files are stored in the private Migrz applicant vault and are never public.</p><label>{busy ? "Working…" : "Choose a file"}<input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])} /></label></section><section className="portal-file-list"><span className="portal-eyebrow">Your documents</span><p aria-live="polite">{message}</p>{documents.map((file) => <div key={file.id}><span>DOC</span><a href={`/api/portal/documents/download?id=${encodeURIComponent(file.id)}`}><strong>{file.fileName}</strong></a><button disabled={busy} onClick={() => void remove(file.id)}>Remove</button></div>)}</section></div></div>;
}

function Payment() {
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Payment</span><h1>Your assessment access is active.</h1><p>Your payment was verified before this workspace opened.</p></header><section className="portal-payment-lock"><span aria-hidden="true">✓</span><div><strong>Payment verified</strong><p>Your receipt remains with the payment provider. Migrz has unlocked this account for one professional pathway assessment.</p></div><button disabled>Paid</button></section></div>;
}

void AssessmentPreview; void DocumentsPreview; void PaymentPreview;

function Help() {
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Help</span><h1>Questions should not stop your progress.</h1><p>Choose the kind of support you need. The live portal will connect these options to the Migrz assessment team.</p></header><div className="portal-help-grid"><article><span>01</span><h2>Assessment question</h2><p>Get clarity about information requested in the assessment.</p><button>Ask a question <Arrow /></button></article><article><span>02</span><h2>Document help</h2><p>Understand which evidence may support your professional record.</p><button>Request guidance <Arrow /></button></article><article><span>03</span><h2>Payment support</h2><p>Ask about assessment scope, checkout or payment confirmation.</p><button>Contact support <Arrow /></button></article></div></div>;
}
