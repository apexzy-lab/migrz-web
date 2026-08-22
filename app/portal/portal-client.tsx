"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

export function PortalClient() {
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
      <div className="portal-private-note"><span aria-hidden="true">⌑</span><p><strong>Your information is private.</strong> Secure submission and encryption will be activated before launch.</p></div>
      <Link className="portal-back-site" href="/">Back to migrzz.com <Arrow /></Link>
    </aside>

    {mobileMenu && <button className="portal-menu-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

    <div className="portal-app">
      <div className="portal-preview-bar"><strong>Portal preview</strong><span>Do not enter sensitive personal information yet. Secure submissions and payments are not active.</span></div>
      <header className="portal-topbar">
        <button className="portal-menu-open" onClick={() => setMobileMenu(true)} aria-label="Open navigation">☰</button>
        <div className="portal-mobile-logo"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></div>
        <p><span className="portal-avatar" aria-hidden="true">A</span>Good evening, Amara.</p>
        <div><button className="portal-text-button" onClick={() => selectView("help")}>Need help?</button><button className="portal-account" aria-label="Open account menu">AM</button></div>
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

function Assessment() {
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

function Documents() {
  const [files, setFiles] = useState<string[]>([]);
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Documents</span><h1>Keep supporting evidence organised.</h1><p>Documents help a reviewer understand and verify your record. Upload only when secure storage is activated.</p></header><div className="portal-document-layout"><section className="portal-upload-zone"><span aria-hidden="true">↑</span><h2>Add a supporting document</h2><p>Preview mode only. Selected files stay on your device and are not uploaded.</p><label>Choose a file<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { const name = event.target.files?.[0]?.name; if (name) setFiles((current) => [...current, name]); }} /></label></section><section className="portal-file-list"><span className="portal-eyebrow">Selected on this device</span>{files.length ? files.map((file) => <div key={file}><span>DOC</span><strong>{file}</strong><button onClick={() => setFiles((current) => current.filter((name) => name !== file))}>Remove</button></div>) : <p>No documents selected.</p>}</section></div></div>;
}

function Payment() {
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Payment</span><h1>Know exactly what you are paying for.</h1><p>Payment will become available after the required information is complete and the assessment plans have been confirmed.</p></header><section className="portal-payment-lock"><span aria-hidden="true">⌑</span><div><strong>Complete your assessment first</strong><p>Finish Career & evidence, review your answers, then choose a plan. The checkout will show the exact price, included deliverables and delivery target before payment.</p></div><button disabled>Checkout locked</button></section></div>;
}

function Help() {
  return <div className="portal-subpage"><header><span className="portal-eyebrow">Help</span><h1>Questions should not stop your progress.</h1><p>Choose the kind of support you need. The live portal will connect these options to the Migrz assessment team.</p></header><div className="portal-help-grid"><article><span>01</span><h2>Assessment question</h2><p>Get clarity about information requested in the assessment.</p><button>Ask a question <Arrow /></button></article><article><span>02</span><h2>Document help</h2><p>Understand which evidence may support your professional record.</p><button>Request guidance <Arrow /></button></article><article><span>03</span><h2>Payment support</h2><p>Ask about assessment scope, checkout or payment confirmation.</p><button>Contact support <Arrow /></button></article></div></div>;
}
