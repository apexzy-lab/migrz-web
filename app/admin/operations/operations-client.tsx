"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = { publicId: string; email: string; fullName: string | null; reviewStatus: string; reviewDueAt: number | null; casevaultStatus: string };
type Detail = {
  application: Row & { id: string; reportPublishedAt: number | null; casevaultReference: string | null; retentionUntil: number | null; answers: Record<string, string> };
  messages: Array<{ id: string; senderRole: string; kind: string; subject: string; body: string; status: string; dueAt: number | null; createdAt: number }>;
  reports: Array<{ id: string; version: number; fileName: string; status: string; summary: string; publishedAt: number | null }>;
  emails: Array<{ id: string; category: string; subject: string; status: string; attempts: number; lastError: string | null; createdAt: number; sentAt: number | null }>;
};

const formatDate = (value: number | null) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not set";

export function OperationsClient() {
  const [access, setAccess] = useState<"checking" | "denied" | "ready">("checking");
  const [rows, setRows] = useState<Row[]>([]); const [selected, setSelected] = useState(""); const [detail, setDetail] = useState<Detail | null>(null);
  const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [due, setDue] = useState(""); const [caseRef, setCaseRef] = useState("");
  const [summary, setSummary] = useState(""); const [report, setReport] = useState<File | null>(null); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [clock] = useState(() => Date.now());

  const loadRows = useCallback(async () => {
    const session = await fetch("/api/portal/session", { cache: "no-store" }); const state = await session.json() as { authenticated?: boolean; user?: { admin?: boolean } };
    if (!state.authenticated || !state.user?.admin) { setAccess("denied"); return; }
    const response = await fetch("/api/admin/overview", { cache: "no-store" }); if (!response.ok) { setAccess("denied"); return; }
    const data = await response.json() as { applications: Row[] }; setRows(data.applications); setAccess("ready");
  }, []);
  const open = useCallback(async (id: string) => {
    setSelected(id); setDetail(null); const response = await fetch(`/api/admin/application?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (response.ok) { const data = await response.json() as Detail; setDetail(data); setCaseRef(data.application.casevaultReference || ""); }
  }, []);
  // The initial private operations read resolves into client state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRows(); }, [loadRows]);

  const operate = async (action: string, payload: Record<string, unknown> = {}) => {
    if (!selected) return; setBusy(true); setNotice(""); const response = await fetch("/api/admin/operations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicId: selected, action, ...payload }) });
    const data = await response.json() as { error?: string; delivery?: string }; setBusy(false); if (!response.ok) { setNotice(data.error || "Operation failed."); return; }
    setNotice(data.delivery === "queued" ? "Saved. Email delivery is queued for follow-up." : "Saved and applicant notified where required."); setMessage(""); setSubject(""); await Promise.all([open(selected), loadRows()]);
  };
  const publish = async () => {
    if (!selected || !report) return; setBusy(true); setNotice(""); const form = new FormData(); form.append("publicId", selected); form.append("summary", summary); form.append("file", report);
    const response = await fetch("/api/admin/reports", { method: "POST", body: form }); const data = await response.json() as { error?: string; delivery?: string }; setBusy(false);
    if (!response.ok) { setNotice(data.error || "Unable to publish report."); return; } setNotice(data.delivery === "queued" ? "Report published. Email delivery is queued." : "Report published and applicant notified."); setReport(null); setSummary(""); await Promise.all([open(selected), loadRows()]);
  };

  if (access !== "ready") return <main className="admin-access"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} /><h1>{access === "checking" ? "Checking secure access…" : "Administrator access required."}</h1><Link href="/admin">Return to secure admin sign-in →</Link></main>;
  return <div className="ops-shell"><header><Link href="/admin"><Image src="/migrz-logo.png" alt="Migrz" width={443} height={84} /></Link><div><span>Case workspace</span><Link href="/admin">← Operations dashboard</Link></div></header><main>
    <aside className="ops-case-list"><div><span className="portal-eyebrow">Active records</span><h1>Applicant cases</h1></div>{rows.map((row) => <button key={row.publicId} className={selected === row.publicId ? "is-active" : ""} onClick={() => void open(row.publicId)}><strong>{row.fullName || row.email}</strong><span>{row.publicId} · {row.reviewStatus.replaceAll("_", " ")}</span>{row.reviewDueAt && row.reviewDueAt < clock && !["completed", "closed"].includes(row.reviewStatus) && <i>Overdue</i>}</button>)}</aside>
    <section className="ops-workspace">{!detail ? <div className="ops-empty"><span>W</span><h2>Select an applicant case.</h2><p>Messages, information requests, reports, delivery history, deadlines, retention and CaseVault handoff are managed here.</p></div> : <><div className="ops-heading"><div><span className="portal-eyebrow">{detail.application.publicId}</span><h1>{detail.application.fullName || detail.application.email}</h1><p>{detail.application.email} · {detail.application.reviewStatus.replaceAll("_", " ")}</p></div><a href={`/api/admin/export?id=${encodeURIComponent(selected)}`}>Export complete case</a></div>{notice && <p className="ops-notice" role="status">{notice}</p>}<div className="ops-grid">
      <section><span className="portal-eyebrow">Service controls</span><h2>Deadline & handoff</h2><label>Review deadline<input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} /></label><button disabled={busy || !due} onClick={() => void operate("review_due", { dueAt: new Date(due).getTime() })}>Save review deadline</button><p>Current target: {formatDate(detail.application.reviewDueAt)}</p><label>CaseVault matter reference<input value={caseRef} onChange={(event) => setCaseRef(event.target.value)} placeholder="CaseVault matter ID or secure reference" /></label><button disabled={busy || !caseRef.trim()} onClick={() => void operate("casevault", { casevaultReference: caseRef })}>Record CaseVault handoff</button><p>Status: {detail.application.casevaultStatus.replaceAll("_", " ")}</p><button disabled={busy} onClick={() => void operate("retention", { retentionUntil: clock + 7 * 365 * 86400000 })}>Set seven-year retention</button><p>Retain until: {formatDate(detail.application.retentionUntil)}</p></section>
      <section><span className="portal-eyebrow">Applicant action</span><h2>Request information</h2><label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What is needed" /></label><label>Secure message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain exactly what is missing and how the applicant should respond." /></label><label>Response due<input type="datetime-local" value={due} onChange={(event) => setDue(event.target.value)} /></label><button disabled={busy || !message.trim()} onClick={() => void operate("request_information", { subject, message, dueAt: due ? new Date(due).getTime() : null })}>Request information & notify</button><button className="is-secondary" disabled={busy || !message.trim()} onClick={() => void operate("message", { subject, message })}>Send as general message</button></section>
      <section><span className="portal-eyebrow">Deliverable</span><h2>Publish written report</h2><label>Applicant-facing summary<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summarise the recommendation and what happens next." /></label><label className="ops-file">PDF report<input type="file" accept="application/pdf,.pdf" onChange={(event) => setReport(event.target.files?.[0] || null)} /></label><button disabled={busy || !report} onClick={() => void publish()}>Publish report & notify</button>{detail.reports.map((item) => <article className="ops-record" key={item.id}><strong>Version {item.version} · {item.status}</strong><span>{item.fileName}</span><small>{formatDate(item.publishedAt)}</small></article>)}</section>
      <section><span className="portal-eyebrow">Secure conversation</span><h2>Message history</h2><div className="ops-history">{detail.messages.map((item) => <article key={item.id}><small>{item.senderRole} · {item.kind} · {formatDate(item.createdAt)}</small><strong>{item.subject}</strong><p>{item.body}</p></article>)}{!detail.messages.length && <p>No messages yet.</p>}</div></section>
      <section className="ops-wide"><span className="portal-eyebrow">Delivery health</span><h2>Email record</h2><div className="ops-deliveries">{detail.emails.map((item) => <article key={item.id}><strong>{item.category.replaceAll("_", " ")}</strong><span>{item.subject}</span><i className={`is-${item.status}`}>{item.status}</i><small>{formatDate(item.sentAt || item.createdAt)} · {item.attempts} attempt(s){item.lastError ? ` · ${item.lastError}` : ""}</small></article>)}{!detail.emails.length && <p>No tracked service emails yet.</p>}</div></section>
    </div></>}</section>
  </main></div>;
}
