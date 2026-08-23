import { audit, json, portalEnv, randomId, requireSession } from "@/app/portal/server";

async function applicationFor(userId: string) {
  return portalEnv.DB.prepare("SELECT id,public_id AS publicId,review_status AS reviewStatus,review_due_at AS reviewDueAt,report_published_at AS reportPublishedAt,casevault_status AS casevaultStatus,casevault_reference AS casevaultReference,retention_until AS retentionUntil FROM applications WHERE user_id=? LIMIT 1").bind(userId).first<{ id: string; publicId: string; reviewStatus: string; reviewDueAt: number | null; reportPublishedAt: number | null; casevaultStatus: string; casevaultReference: string | null; retentionUntil: number | null }>();
}

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await applicationFor(session.user.id); if (!application) return json({ application: null, messages: [], report: null });
  const [messages, report] = await Promise.all([
    portalEnv.DB.prepare("SELECT id,sender_role AS senderRole,kind,subject,body,status,due_at AS dueAt,resolved_at AS resolvedAt,created_at AS createdAt FROM service_messages WHERE application_id=? ORDER BY created_at ASC LIMIT 300").bind(application.id).all(),
    portalEnv.DB.prepare("SELECT id,version,file_name AS fileName,size,summary,published_at AS publishedAt FROM assessment_reports WHERE application_id=? AND status='published' ORDER BY version DESC LIMIT 1").bind(application.id).first(),
  ]);
  await portalEnv.DB.prepare("UPDATE service_messages SET read_by_applicant_at=coalesce(read_by_applicant_at,?) WHERE application_id=? AND sender_role='admin'").bind(Date.now(), application.id).run();
  return json({ application, messages: messages.results, report });
}

export async function POST(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await applicationFor(session.user.id); if (!application) return json({ error: "Application not found" }, 404);
  const body = await request.json() as { body?: unknown; subject?: unknown; replyTo?: unknown };
  const message = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : ""; const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 160) : "";
  if (!message) return json({ error: "Write a message before sending." }, 400);
  const now = Date.now(); const id = randomId("msg_");
  await portalEnv.DB.prepare("INSERT INTO service_messages (id,application_id,user_id,sender_user_id,sender_role,kind,subject,body,status,read_by_applicant_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, application.id, session.user.id, session.user.id, "applicant", "message", subject || "Applicant message", message, "open", now, now, now).run();
  if (typeof body.replyTo === "string" && body.replyTo) await portalEnv.DB.prepare("UPDATE service_messages SET status='answered',resolved_at=?,updated_at=? WHERE id=? AND application_id=? AND kind='information_request'").bind(now, now, body.replyTo, application.id).run();
  await audit("applicant_message_sent", "application", application.id, session.user.id, { messageId: id, publicId: application.publicId });
  return json({ ok: true, id }, 201);
}
