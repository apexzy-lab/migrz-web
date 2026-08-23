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
  await portalEnv.DB.batch([
    portalEnv.DB.prepare("UPDATE assessment_reports SET status='superseded' WHERE application_id=? AND status='published'").bind(application.id),
    portalEnv.DB.prepare("INSERT INTO assessment_reports (id,application_id,user_id,version,r2_key,file_name,content_type,size,status,summary,created_by,created_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, application.id, application.userId, version, key, file.name.slice(0, 180), "application/pdf", file.size, "published", summary, session.user.id, now, now),
    portalEnv.DB.prepare("UPDATE applications SET review_status='completed',report_published_at=?,admin_updated_at=?,updated_at=? WHERE id=?").bind(now, now, now, application.id),
  ]);
  await createNotification(application.userId, "report_published", "Your written assessment is ready", summary || `Report version ${version} is ready to download.`, "Download report", "report", "report", id);
  const email = serviceUpdateEmail(`Your Migrz written assessment is ready — ${publicId}`, "Your written pathway report is ready", summary || "Sign in to download your written assessment and book your review call.", "Download your report");
  const delivery = await deliverTrackedEmail({ userId: application.userId, applicationId: application.id, category: "report_published", recipient: application.email, ...email });
  await audit("assessment_report_published", "application", application.id, session.user.id, { publicId, reportId: id, version, delivery }); return json({ ok: true, id, version, delivery }, 201);
}
