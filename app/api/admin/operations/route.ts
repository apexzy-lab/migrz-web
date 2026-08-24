import { serviceUpdateEmail } from "@/app/portal/email";
import { audit, createNotification, deliverTrackedEmail, json, portalEnv, randomId, requireAdmin } from "@/app/portal/server";

async function find(publicId: string) {
  return portalEnv.DB.prepare("SELECT a.id,a.user_id AS userId,a.public_id AS publicId,a.review_status AS reviewStatus,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.public_id=? LIMIT 1").bind(publicId).first<{ id: string; userId: string; publicId: string; reviewStatus: string; email: string }>();
}

export async function POST(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { publicId?: unknown; action?: unknown; subject?: unknown; message?: unknown; dueAt?: unknown; casevaultReference?: unknown; retentionUntil?: unknown; emailId?: unknown; items?: unknown; title?: unknown; executiveSummary?: unknown; pathways?: unknown; evidenceGaps?: unknown; nextSteps?: unknown; reportId?: unknown; tag?: unknown };
  const publicId = typeof body.publicId === "string" ? body.publicId : ""; const application = await find(publicId); if (!application) return json({ error: "Application not found" }, 404);
  const action = typeof body.action === "string" ? body.action : ""; const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 160) : ""; const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : ""; const now = Date.now();
  if (action === "message" || action === "request_information") {
    if (!message) return json({ error: "Write a message before sending." }, 400); const kind = action === "request_information" ? "information_request" : "message"; const id = randomId("msg_"); const dueAt = action === "request_information" && Number.isFinite(Number(body.dueAt)) ? Number(body.dueAt) : null;
    await portalEnv.DB.batch([
      portalEnv.DB.prepare("INSERT INTO service_messages (id,application_id,user_id,sender_user_id,sender_role,kind,subject,body,status,due_at,read_by_admin_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, application.id, application.userId, session.user.id, "admin", kind, subject || (kind === "information_request" ? "More information required" : "Message from Migrz"), message, "open", dueAt, now, now, now),
      ...(kind === "information_request" ? [portalEnv.DB.prepare("UPDATE applications SET review_status='needs_information',admin_updated_at=?,updated_at=? WHERE id=?").bind(now, now, application.id)] : []),
      ...(kind === "information_request" && Array.isArray(body.items) ? body.items.map((value) => String(value).trim().slice(0, 500)).filter(Boolean).slice(0, 20).map((label) => portalEnv.DB.prepare("INSERT INTO information_request_items (id,message_id,application_id,label,response_type,required,status,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(randomId("iri_"), id, application.id, label, "text", 1, "open", now)) : []),
    ]);
    await createNotification(application.userId, kind, subject || (kind === "information_request" ? "Migrz needs more information" : "New message from Migrz"), message, kind === "information_request" ? "Respond securely" : "Read message", "inbox", "application", application.id);
    const email = serviceUpdateEmail(`${subject || "Update from Migrz"} — ${publicId}`, subject || "You have a new Migrz update", message, "Read and respond securely");
    const delivery = await deliverTrackedEmail({ userId: application.userId, applicationId: application.id, category: kind, recipient: application.email, ...email });
    await audit(kind === "information_request" ? "information_requested" : "admin_message_sent", "application", application.id, session.user.id, { publicId, messageId: id, delivery });
    return json({ ok: true, id, delivery }, 201);
  }
  if (action === "structured_report") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : ""; const executiveSummary = typeof body.executiveSummary === "string" ? body.executiveSummary.trim().slice(0, 8000) : ""; if (!title || !executiveSummary) return json({ error: "Add a report title and executive summary." }, 400);
    const lines = (value: unknown) => Array.isArray(value) ? value.map(String).map((item) => item.trim().slice(0, 1000)).filter(Boolean).slice(0, 30) : [];
    const latest = await portalEnv.DB.prepare("SELECT coalesce(max(version),0) AS version FROM structured_reports WHERE application_id=?").bind(application.id).first<{ version: number }>(); const id = randomId("srpt_");
    await portalEnv.DB.prepare("INSERT INTO structured_reports (id,application_id,version,title,executive_summary,pathways_json,evidence_gaps_json,next_steps_json,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, application.id, (latest?.version || 0) + 1, title, executiveSummary, JSON.stringify(lines(body.pathways)), JSON.stringify(lines(body.evidenceGaps)), JSON.stringify(lines(body.nextSteps)), "draft", session.user.id, now, now).run(); await audit("structured_report_drafted", "application", application.id, session.user.id, { publicId, reportId: id }); return json({ ok: true, id }, 201);
  }
  if (action === "publish_structured_report") {
    const reportId = typeof body.reportId === "string" ? body.reportId : ""; const report = await portalEnv.DB.prepare("SELECT id,title,executive_summary AS executiveSummary FROM structured_reports WHERE id=? AND application_id=? AND status='draft'").bind(reportId, application.id).first<{ id: string; title: string; executiveSummary: string }>(); if (!report) return json({ error: "Draft report not found." }, 404);
    await portalEnv.DB.prepare("UPDATE structured_reports SET status='published',approved_by=?,updated_at=?,published_at=? WHERE id=?").bind(session.user.id, now, now, reportId).run(); await createNotification(application.userId, "structured_report_published", "Your assessment summary is ready", report.executiveSummary.slice(0, 500), "View your report", "report", "application", application.id); const email = serviceUpdateEmail(`${report.title} — ${publicId}`, "Your Migrz assessment summary is ready", report.executiveSummary, "View your secure report"); const delivery = await deliverTrackedEmail({ userId: application.userId, applicationId: application.id, category: "structured_report_published", recipient: application.email, ...email }); await audit("structured_report_published", "application", application.id, session.user.id, { publicId, reportId, delivery }); return json({ ok: true, delivery });
  }
  if (action === "tag_add" || action === "tag_remove") {
    const tag = typeof body.tag === "string" ? body.tag.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").slice(0, 40) : ""; if (!tag) return json({ error: "Add a valid tag." }, 400); if (action === "tag_add") await portalEnv.DB.prepare("INSERT OR IGNORE INTO application_tags (application_id,tag,created_by,created_at) VALUES (?,?,?,?)").bind(application.id, tag, session.user.id, now).run(); else await portalEnv.DB.prepare("DELETE FROM application_tags WHERE application_id=? AND tag=?").bind(application.id, tag).run(); await audit(action, "application", application.id, session.user.id, { publicId, tag }); return json({ ok: true });
  }
  if (action === "casevault") {
    const reference = typeof body.casevaultReference === "string" ? body.casevaultReference.trim().slice(0, 200) : ""; if (!reference) return json({ error: "Add the CaseVault matter reference." }, 400);
    await portalEnv.DB.prepare("UPDATE applications SET casevault_status='handed_off',casevault_reference=?,admin_updated_at=?,updated_at=? WHERE id=?").bind(reference, now, now, application.id).run();
    await createNotification(application.userId, "casevault_handoff", "Your file has moved to CaseVault", `Your assessment has moved into Migrz case operations under reference ${reference}.`, "View update", "inbox", "application", application.id);
    await audit("casevault_handoff_recorded", "application", application.id, session.user.id, { publicId, reference }); return json({ ok: true });
  }
  if (action === "retention") {
    const until = Number(body.retentionUntil); if (!Number.isFinite(until) || until < now) return json({ error: "Choose a future retention date." }, 400);
    await portalEnv.DB.prepare("UPDATE applications SET retention_until=?,admin_updated_at=? WHERE id=?").bind(until, now, application.id).run(); await audit("retention_date_updated", "application", application.id, session.user.id, { publicId, until }); return json({ ok: true });
  }
  if (action === "review_due") {
    const due = Number(body.dueAt); if (!Number.isFinite(due)) return json({ error: "Choose a valid review deadline." }, 400);
    await portalEnv.DB.prepare("UPDATE applications SET review_due_at=?,admin_updated_at=? WHERE id=?").bind(due, now, application.id).run(); await audit("review_due_date_updated", "application", application.id, session.user.id, { publicId, due }); return json({ ok: true });
  }
  if (action === "resend_email") {
    const emailId = typeof body.emailId === "string" ? body.emailId : ""; const deliveryRecord = await portalEnv.DB.prepare("SELECT id,category,subject,status FROM email_deliveries WHERE id=? AND application_id=? LIMIT 1").bind(emailId, application.id).first<{ id: string; category: string; subject: string; status: string }>(); if (!deliveryRecord) return json({ error: "Email record not found." }, 404);
    let heading = "Update from Migrz"; let detail = "Sign in to your secure portal to review the latest update."; let actionLabel = "Open your secure portal";
    if (["message", "information_request"].includes(deliveryRecord.category)) { const source = await portalEnv.DB.prepare("SELECT subject,body FROM service_messages WHERE application_id=? AND kind=? ORDER BY created_at DESC LIMIT 1").bind(application.id, deliveryRecord.category).first<{ subject: string; body: string }>(); if (source) { heading = source.subject; detail = source.body; actionLabel = "Read and respond securely"; } }
    if (deliveryRecord.category === "report_published") { const source = await portalEnv.DB.prepare("SELECT summary FROM assessment_reports WHERE application_id=? AND status='published' ORDER BY version DESC LIMIT 1").bind(application.id).first<{ summary: string }>(); heading = "Your written pathway report is ready"; detail = source?.summary || "Sign in to download your written assessment and book your review call."; actionLabel = "Download your report"; }
    const email = serviceUpdateEmail(deliveryRecord.subject, heading, detail, actionLabel); const delivery = await deliverTrackedEmail({ userId: application.userId, applicationId: application.id, category: `${deliveryRecord.category}_resend`, recipient: application.email, ...email }); await audit("service_email_resent", "application", application.id, session.user.id, { publicId, originalEmailId: emailId, delivery }); return json({ ok: true, delivery });
  }
  return json({ error: "Unsupported operation" }, 400);
}
