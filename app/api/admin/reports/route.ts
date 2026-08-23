import { serviceUpdateEmail } from "@/app/portal/email";
import { audit, createNotification, deliverTrackedEmail, json, portalEnv, randomId, requireAdmin } from "@/app/portal/server";

export async function POST(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!; const form = await request.formData();
  const publicId = String(form.get("publicId") || ""); const summary = String(form.get("summary") || "").trim().slice(0, 2000); const file = form.get("file"); if (!(file instanceof File)) return json({ error: "Choose a PDF report." }, 400);
  if (file.type !== "application/pdf" || file.size < 5 || file.size > 15 * 1024 * 1024) return json({ error: "Report must be a PDF up to 15 MB." }, 400);
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer()); if (new TextDecoder().decode(signature) !== "%PDF-") return json({ error: "The uploaded file is not a valid PDF." }, 400);
  const application = await portalEnv.DB.prepare("SELECT a.id,a.user_id AS userId,a.public_id AS publicId,u.email FROM applications a JOIN users u ON u.id=a.user_id WHERE a.public_id=? LIMIT 1").bind(publicId).first<{ id: string; userId: string; publicId: string; email: string }>(); if (!application) return json({ error: "Application not found" }, 404);
  const latest = await portalEnv.DB.prepare("SELECT coalesce(max(version),0) AS version FROM assessment_reports WHERE application_id=?").bind(application.id).first<{ version: number }>(); const version = Number(latest?.version || 0) + 1; const id = randomId("rpt_"); const key = `reports/${application.userId}/${application.id}/${id}.pdf`; const now = Date.now();
  await portalEnv.DOCUMENTS.put(key, file.stream(), { httpMetadata: { contentType: "application/pdf" }, customMetadata: { applicationId: application.id, version: String(version) } });
  await portalEnv.DB.prepare("INSERT INTO assessment_reports (id,application_id,user_id,version,r2_key,file_name,content_type,size,status,summary,created_by,created_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL)")
    .bind(id, application.id, application.userId, version, key, file.name.slice(0, 180), "application/pdf", file.size, "draft", summary, session.user.id, now).run();
  await audit("assessment_report_uploaded_for_approval", "application", application.id, session.user.id, { publicId, reportId: id, version }); return json({ ok: true, id, version, status: "draft" }, 201);
}

export async function PATCH(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!; const body = await request.json() as { reportId?: unknown }; const reportId = typeof body.reportId === "string" ? body.reportId : "";
  const report = await portalEnv.DB.prepare("SELECT r.id,r.application_id AS applicationId,r.user_id AS userId,r.version,r.summary,r.status,a.public_id AS publicId,u.email FROM assessment_reports r JOIN applications a ON a.id=r.application_id JOIN users u ON u.id=r.user_id WHERE r.id=? LIMIT 1").bind(reportId).first<{ id: string; applicationId: string; userId: string; version: number; summary: string; status: string; publicId: string; email: string }>();
  if (!report) return json({ error: "Report not found" }, 404); if (report.status !== "draft") return json({ error: "Only a draft report can be approved." }, 409); const now = Date.now();
  await portalEnv.DB.batch([
    portalEnv.DB.prepare("UPDATE assessment_reports SET status='superseded' WHERE application_id=? AND status='published'").bind(report.applicationId),
    portalEnv.DB.prepare("UPDATE assessment_reports SET status='published',published_at=? WHERE id=? AND status='draft'").bind(now, report.id),
    portalEnv.DB.prepare("UPDATE applications SET review_status='completed',report_published_at=?,admin_updated_at=?,updated_at=? WHERE id=?").bind(now, now, now, report.applicationId),
  ]);
  await createNotification(report.userId, "report_published", "Your written assessment is ready", report.summary || `Report version ${report.version} is ready to download.`, "Download report", "report", "report", report.id);
  const email = serviceUpdateEmail(`Your Migrz written assessment is ready — ${report.publicId}`, "Your written pathway report is ready", report.summary || "Sign in to download your written assessment and book your review call.", "Download your report");
  const delivery = await deliverTrackedEmail({ userId: report.userId, applicationId: report.applicationId, category: "report_published", recipient: report.email, ...email });
  await audit("assessment_report_published", "application", report.applicationId, session.user.id, { publicId: report.publicId, reportId: report.id, version: report.version, approved: true, delivery }); return json({ ok: true, delivery });
}
