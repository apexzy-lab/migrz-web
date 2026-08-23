import { json, portalEnv, requireAdmin } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!; const publicId = new URL(request.url).searchParams.get("id") || "";
  const application = await portalEnv.DB.prepare("SELECT a.*,u.email,u.country_residence FROM applications a JOIN users u ON u.id=a.user_id WHERE a.public_id=? LIMIT 1").bind(publicId).first(); if (!application) return json({ error: "Application not found" }, 404);
  const app = application as Record<string, unknown>; const applicationId = String(app.id); const [documents,messages,notes,payments,appointments,reports,auditTrail] = await Promise.all([
    portalEnv.DB.prepare("SELECT id,file_name AS fileName,content_type AS contentType,size,status,created_at AS createdAt FROM documents WHERE application_id=?").bind(applicationId).all(),
    portalEnv.DB.prepare("SELECT sender_role AS senderRole,kind,subject,body,status,due_at AS dueAt,created_at AS createdAt FROM service_messages WHERE application_id=?").bind(applicationId).all(),
    portalEnv.DB.prepare("SELECT note,created_at AS createdAt FROM application_notes WHERE application_id=?").bind(applicationId).all(),
    portalEnv.DB.prepare("SELECT plan,provider,amount_minor AS amountMinor,currency,status,provider_reference AS providerReference,paid_at AS paidAt FROM payments WHERE user_id=?").bind(String(app.user_id)).all(),
    portalEnv.DB.prepare("SELECT * FROM appointment_requests WHERE application_id=?").bind(applicationId).all(),
    portalEnv.DB.prepare("SELECT id,version,file_name AS fileName,status,summary,created_at AS createdAt,published_at AS publishedAt FROM assessment_reports WHERE application_id=?").bind(applicationId).all(),
    portalEnv.DB.prepare("SELECT event,metadata_json AS metadataJson,created_at AS createdAt FROM audit_events WHERE entity_id=? ORDER BY created_at").bind(applicationId).all(),
  ]);
  const bundle = { exportedAt: new Date().toISOString(), application: { ...app, answers: JSON.parse(String(app.answers_json || "{}")), answers_json: undefined }, documents: documents.results, messages: messages.results, internalNotes: notes.results, payments: payments.results, appointments: appointments.results, reports: reports.results, auditTrail: auditTrail.results };
  return new Response(JSON.stringify(bundle, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename=${publicId || "migrz-case"}-export.json`, "cache-control": "private, no-store" } });
}
