import { serviceUpdateEmail } from "@/app/portal/email";
import { audit, createNotification, deliverTrackedEmail, json, portalEnv, randomId, requireAdmin } from "@/app/portal/server";

async function find(publicId: string) {
  return portalEnv.DB.prepare("SELECT a.id,a.user_id AS userId,a.public_id AS publicId,a.review_status AS reviewStatus,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.public_id=? LIMIT 1").bind(publicId).first<{ id: string; userId: string; publicId: string; reviewStatus: string; email: string }>();
}

export async function POST(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!;
  const body = await request.json() as { publicId?: unknown; action?: unknown; subject?: unknown; message?: unknown; dueAt?: unknown; casevaultReference?: unknown; retentionUntil?: unknown; emailId?: unknown };
  const publicId = typeof body.publicId === "string" ? body.publicId : ""; const application = await find(publicId); if (!application) return json({ error: "Application not found" }, 404);
  const action = typeof body.action === "string" ? body.action : ""; const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 160) : ""; const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : ""; const now = Date.now();
  if (action === "message" || action === "request_information") {
    if (!message) return json({ error: "Write a message before sending." }, 400); const kind = action === "request_information" ? "information_request" : "message"; const id = randomId("msg_"); const dueAt = action === "request_information" && Number.isFinite(Number(body.dueAt)) ? Number(body.dueAt) : null;
    await portalEnv.DB.batch([
      portalEnv.DB.prepare("INSERT INTO service_messages (id,application_id,user_id,sender_user_id,sender_role,kind,subject,body,status,due_at,read_by_admin_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, application.id, application.userId, session.user.id, "admin", kind, subject || (kind === "information_request" ? "More information required" : "Message from Migrz"), message, "open", dueAt, now, now, now),
      ...(kind === "information_request" ? [portalEnv.DB.prepare("UPDATE applications SET review_status='needs_information',admin_updated_at=?,updated_at=? WHERE id=?").bind(now, now, application.id)] : []),
    ]);
    await createNotification(application.userId, kind, subject || (kind === "information_request" ? "Migrz needs more information" : "New message from Migrz"), message, kind === "information_request" ? "Respond securely" : "Read message", "inbox", "application", application.id);
    const email = serviceUpdateEmail(`${subject || "Update from Migrz"} — ${publicId}`, subject || "You have a new Migrz update", message, "Read and respond securely");
    const delivery = await deliverTrackedEmail({ userId: application.userId, applicationId: application.id, category: kind, recipient: application.email, ...email });
    await audit(kind === "information_request" ? "information_requested" : "admin_message_sent", "application", application.id, session.user.id, { publicId, messageId: id, delivery });
    return json({ ok: true, id, delivery }, 201);
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
