"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ChapterId = "strategy" | "assessment" | "evidence" | "payment" | "onboarding";
type EvidenceId = "career" | "education" | "recognition" | "publications";

const chapters: { id: ChapterId; number: string; label: string; state: "done" | "active" | "next" }[] = [
  { id: "strategy", number: "01", label: "Strategy", state: "done" },
  { id: "assessment", number: "02", label: "Assessment", state: "done" },
  { id: "evidence", number: "03", label: "Evidence", state: "active" },
  { id: "payment", number: "04", label: "Payment", state: "next" },
  { id: "onboarding", number: "05", label: "Onboarding", state: "next" },
];

const initialEvidence = [
  { id: "career" as EvidenceId, number: "01", label: "Career", count: "4 / 6", note: "Roles, leadership, measurable impact and critical responsibilities." },
  { id: "education" as EvidenceId, number: "02", label: "Education", count: "3 / 4", note: "Degrees, professional training and field-specific credentials." },
  { id: "recognition" as EvidenceId, number: "03", label: "Recognition", count: "2 / 5", note: "Awards, honours, memberships, fellowships and formal recognition." },
  { id: "publications" as EvidenceId, number: "04", label: "Publications", count: "1 / 4", note: "Authored work, citations, press coverage and public contribution." },
];

const screenCopy: Record<Exclude<ChapterId, "evidence">, { eyebrow: string; title: string; copy: string; action: string }> = {
  strategy: {
    eyebrow: "01 — Strategy brief",
    title: "Begin with the life you are trying to build.",
    copy: "Define the destination, timing and non-negotiables behind your move. Migrz uses this context to assess routes against your real career and family priorities—not just isolated eligibility criteria.",
    action: "Review strategy brief",
  },
  assessment: {
    eyebrow: "02 — Professional assessment",
    title: "Turn your history into a decision-ready profile.",
    copy: "We examine your education, career, leadership, recognition, compensation, publications and other evidence. Your answers inform a professional review; they do not produce an automatic eligibility decision.",
    action: "Continue assessment",
  },
  payment: {
    eyebrow: "04 — Assessment plan",
    title: "Choose the review pace that fits your decision.",
    copy: "Your plan covers the professional assessment and written pathway report described at checkout. Government fees, legal representation and any later application work are separate unless expressly included.",
    action: "Review assessment plans",
  },
  onboarding: {
    eyebrow: "05 — Onboarding",
    title: "Move forward with a clear handoff.",
    copy: "If you engage Migrz after assessment, the approved record and essential documents can be prepared for transfer into CaseVault, where the core immigration matter is managed. Nothing is transferred without your permission.",
    action: "Review onboarding steps",
  },
};

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export function PortalClient() {
  const [chapter, setChapter] = useState<ChapterId>("evidence");
  const [openEvidence, setOpenEvidence] = useState<EvidenceId>("recognition");
  const [saved, setSaved] = useState(true);
  const [fileName, setFileName] = useState("global-innovation-award.pdf");
  const activeIndex = chapters.findIndex((item) => item.id === chapter);
  const progress = useMemo(() => chapter === "evidence" ? 72 : Math.max(24, (activeIndex + 1) * 18), [activeIndex, chapter]);

  const markChanged = () => {
    setSaved(false);
    window.setTimeout(() => setSaved(true), 650);
  };

  return (
    <div className="portal-shell">
      <aside className="portal-rail" aria-label="Application chapters">
        <Link href="/" className="portal-logo" aria-label="Migrz home"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></Link>
        <div className="portal-chapter-mark" aria-hidden="true">
          <strong>{chapters[activeIndex]?.number}</strong>
          <span>— {chapters[activeIndex]?.label}</span>
        </div>
        <nav className="portal-chapters">
          {chapters.map((item) => (
            <button key={item.id} className={chapter === item.id ? "is-active" : ""} onClick={() => setChapter(item.id)} aria-current={chapter === item.id ? "step" : undefined}>
              <span>{item.number}</span><i aria-hidden="true" /><b>{item.label}</b><em aria-hidden="true">{item.state === "done" ? "✓" : chapter === item.id ? "●" : "○"}</em>
            </button>
          ))}
        </nav>
        <button className="portal-handoff" onClick={() => setChapter("onboarding")}>
          <Arrow />
          <span>CaseVault handoff<br />after engagement</span>
        </button>
        <div className="portal-rail-foot"><button>Help</button><button aria-label="Open account menu">AM</button></div>
      </aside>

      <div className="portal-workspace">
        <header className="portal-mobile-head">
          <Link href="/" aria-label="Migrz home"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} priority /></Link>
          <span>{chapters[activeIndex]?.number} / 05</span>
          <button aria-label="Open account menu">AM</button>
        </header>

        {chapter === "evidence" ? (
          <EvidenceStudio openEvidence={openEvidence} setOpenEvidence={setOpenEvidence} fileName={fileName} setFileName={setFileName} markChanged={markChanged} />
        ) : (
          <ChapterOverview chapter={chapter} onContinue={() => setChapter(chapters[Math.min(activeIndex + 1, chapters.length - 1)].id)} />
        )}

        <aside className="portal-context" aria-label="Application context">
          <div className="reviewer-card">
            <span className="portal-kicker">Review context</span>
            <div><span className="reviewer-avatar" aria-hidden="true">M</span><p><small>Your Migrz team</small><strong>Assessment desk</strong><em>Professional review</em></p></div>
          </div>
          <div className="portal-progress">
            <span className="portal-kicker">Application progress</span>
            <strong>{progress}<sup>%</sup></strong>
            <span>complete</span>
            <div aria-label={`${progress}% complete`}><i style={{ width: `${progress}%` }} /></div>
            <p>{chapter === "evidence" ? "Keep building a credible, well-documented record." : "Complete each chapter at your own pace. Your work is saved on this device for this preview."}</p>
          </div>
          <div className="privacy-card"><span aria-hidden="true">□</span><div><strong>Private by design</strong><p>Sensitive documents require secure storage and controlled access before this portal replaces the current form.</p></div></div>
          <button className="portal-save" onClick={() => setSaved(true)}>{chapter === "evidence" ? "Save & continue" : "Continue"} <Arrow /></button>
          <span className={`save-state ${saved ? "is-saved" : ""}`}>{saved ? "✓ All changes saved" : "Saving changes…"}</span>
        </aside>
      </div>

      <nav className="portal-mobile-nav" aria-label="Mobile application navigation">
        {chapters.map((item) => <button key={item.id} onClick={() => setChapter(item.id)} className={chapter === item.id ? "is-active" : ""}><span>{item.number}</span>{item.label}</button>)}
      </nav>
    </div>
  );
}

function EvidenceStudio({ openEvidence, setOpenEvidence, fileName, setFileName, markChanged }: {
  openEvidence: EvidenceId;
  setOpenEvidence: (id: EvidenceId) => void;
  fileName: string;
  setFileName: (name: string) => void;
  markChanged: () => void;
}) {
  return <main className="portal-dossier" id="main">
    <div className="dossier-tab" aria-hidden="true">Applicant copy</div>
    <header className="dossier-meta"><span>Applicant: Amara M.</span><span>Dossier: MZ—ASSESSMENT</span><span>Last saved: just now</span></header>
    <div className="dossier-title">
      <div><span className="portal-kicker">03 — Evidence studio</span><h1>Build the record<br />behind your route.</h1></div>
      <div className="dossier-photo" role="img" aria-label="Abstract architectural colonnade"><i /><i /><i /><span>Evidence / structure / movement</span></div>
    </div>
    <div className="evidence-list">
      {initialEvidence.map((item) => {
        const open = openEvidence === item.id;
        return <section className={`evidence-row ${open ? "is-open" : ""}`} key={item.id}>
          <button className="evidence-trigger" onClick={() => setOpenEvidence(item.id)} aria-expanded={open}>
            <span>{item.number}</span><strong>{item.label}</strong><small>{item.count} items added</small><b aria-hidden="true">{open ? "−" : "+"}</b>
          </button>
          {open && <div className="evidence-editor">
            <div className="editor-intro"><p>{item.note}</p><span>Quality over quantity. Add evidence that another person could verify.</span></div>
            <label>Evidence title<input defaultValue={item.id === "recognition" ? "Global Innovation Award" : ""} placeholder={`Add ${item.label.toLowerCase()} evidence`} onChange={markChanged} /></label>
            <label>Issuing organisation<input defaultValue={item.id === "recognition" ? "Tech Forward Alliance" : ""} placeholder="Organisation or institution" onChange={markChanged} /></label>
            <label>Date received<input type="date" defaultValue={item.id === "recognition" ? "2023-05-15" : ""} onChange={markChanged} /></label>
            <label className="editor-description">Why this matters<textarea defaultValue={item.id === "recognition" ? "Recognised for leadership in scalable AI systems designed for public benefit." : ""} placeholder="Describe the achievement, your role and its measurable relevance." onChange={markChanged} /></label>
            <div className="document-card">
              <div className="document-preview"><span>MIGRZ / EVIDENCE</span><strong>{fileName ? fileName.split(".")[0].replaceAll("-", " ") : "No document selected"}</strong><small>Applicant supporting record</small></div>
              <div><span className="portal-kicker">Supporting document</span><strong>{fileName || "Attach a document"}</strong><small>PDF, JPG or PNG · preview only</small><label className="upload-control">Choose file<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { setFileName(event.target.files?.[0]?.name || ""); markChanged(); }} /></label></div>
            </div>
          </div>}
        </section>;
      })}
    </div>
    <footer className="dossier-note"><span>⌁</span><p>Add strong, verifiable evidence. A longer record is not automatically a stronger one.</p><button>Book a strategy call <Arrow /></button></footer>
  </main>;
}

function ChapterOverview({ chapter, onContinue }: { chapter: Exclude<ChapterId, "evidence">; onContinue: () => void }) {
  const copy = screenCopy[chapter];
  return <main className="portal-dossier portal-overview" id="main">
    <div className="dossier-tab" aria-hidden="true">Applicant copy</div>
    <header className="dossier-meta"><span>Applicant: Amara M.</span><span>Migrz assessment</span><span>Private workspace</span></header>
    <div className="overview-statement"><span className="portal-kicker">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.copy}</p><button onClick={onContinue}>{copy.action} <Arrow /></button></div>
    <div className="overview-ledger">
      <article><span>01</span><div><strong>Your record</strong><p>Concrete facts, dates, roles and evidence—kept separate from assumptions.</p></div></article>
      <article><span>02</span><div><strong>Our review</strong><p>Professional analysis of possible routes, limitations and evidence gaps.</p></div></article>
      <article><span>03</span><div><strong>Your decision</strong><p>A clear next step without automated approval claims or hidden commitments.</p></div></article>
    </div>
    {chapter === "onboarding" && <div className="casevault-boundary"><span>CaseVault</span><strong>Core case management starts after engagement.</strong><p>Migrz Portal handles assessment and onboarding. CaseVault manages the engaged immigration matter, documents, deadlines and case communication.</p></div>}
  </main>;
}
