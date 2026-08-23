import { portalEnv, requireSession } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireSession(request); if (session.error || !session.user) return session.error!;
  const [application, payments, documents, messages, appointments] = await Promise.all([
    portalEnv.DB.prepare("SELECT public_id AS publicId,status,review_status AS reviewStatus,answers_json AS answersJson,created_at AS createdAt,updated_at AS updatedAt,submitted_at AS submittedAt,review_due_at AS reviewDueAt,casevault_status AS casevaultStatus,retention_until AS retentionUntil FROM applications WHERE user_id=?").bind(session.user.id).first(),
    portalEnv.DB.prepare("SELECT plan,provider,amount_minor AS amountMinor,currency,status,provider_reference AS providerReference,created_at AS createdAt,paid_at AS paidAt FROM payments WHERE user_id=?").bind(session.user.id).all(),
    portalEnv.DB.prepare("SELECT file_name AS fileName,content_type AS contentType,size,status,created_at AS createdAt FROM documents WHERE user_id=?").bind(session.user.id).all(),
    portalEnv.DB.prepare("SELECT sender_role AS senderRole,kind,subject,body,status,created_at AS createdAt FROM service_messages WHERE user_id=?").bind(session.user.id).all(),
    portalEnv.DB.prepare("SELECT public_id AS publicId,status,requested_start AS requestedStart,confirmed_start AS confirmedStart,duration_minutes AS durationMinutes,timezone,provider,completed_at AS completedAt FROM appointment_requests WHERE user_id=?").bind(session.user.id).all(),
  ]);
  const record = { exportedAt: new Date().toISOString(), account: { email: session.user.email, countryResidence: session.user.countryResidence }, application: application ? { ...application, answers: JSON.parse(String((application as { answersJson?: string }).answersJson || "{}")), answersJson: undefined } : null, payments: payments.results, documents: documents.results, messages: messages.results, appointments: appointments.results };
  return new Response(JSON.stringify(record, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=migrz-account-export.json", "cache-control": "private, no-store" } });
}
