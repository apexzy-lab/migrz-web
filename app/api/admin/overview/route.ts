import { json, portalEnv, requireAdmin } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireAdmin(request); if (session.error || !session.user) return session.error!;
  const url = new URL(request.url); const search = (url.searchParams.get("search") || "").trim().slice(0, 120); const status = (url.searchParams.get("status") || "").trim();
  const validStatuses = ["draft", "submitted", "in_review", "needs_information", "completed", "closed"];
  const where: string[] = []; const bindings: string[] = [];
  if (search) { where.push("(lower(u.email) LIKE ? OR lower(coalesce(a.public_id,'')) LIKE ? OR lower(coalesce(json_extract(a.answers_json,'$.fullName'),'')) LIKE ?)"); const term = `%${search.toLowerCase()}%`; bindings.push(term, term, term); }
  if (validStatuses.includes(status)) { where.push("a.review_status=?"); bindings.push(status); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [metrics, applications, payments, activity, admins, appointments] = await Promise.all([
    portalEnv.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN review_status='submitted' THEN 1 ELSE 0 END) AS awaiting, SUM(CASE WHEN review_status='in_review' THEN 1 ELSE 0 END) AS inReview, SUM(CASE WHEN review_status='needs_information' THEN 1 ELSE 0 END) AS needsInformation, SUM(CASE WHEN review_status='completed' THEN 1 ELSE 0 END) AS completed FROM applications`).first(),
    portalEnv.DB.prepare(`SELECT a.id,a.public_id AS publicId,a.status,a.review_status AS reviewStatus,a.current_section AS currentSection,a.submitted_at AS submittedAt,a.updated_at AS updatedAt,u.email,json_extract(a.answers_json,'$.fullName') AS fullName,json_extract(a.answers_json,'$.preferredDestination') AS preferredDestination,ad.email AS assignedTo FROM applications a JOIN users u ON u.id=a.user_id LEFT JOIN admins aa ON aa.id=a.assigned_admin_id LEFT JOIN users ad ON ad.id=aa.user_id ${clause} ORDER BY CASE a.review_status WHEN 'submitted' THEN 1 WHEN 'needs_information' THEN 2 WHEN 'in_review' THEN 3 WHEN 'draft' THEN 4 ELSE 5 END,a.updated_at DESC LIMIT 200`).bind(...bindings).all(),
    portalEnv.DB.prepare(`SELECT p.id,p.plan,p.provider,p.amount_minor AS amountMinor,p.currency,p.status,p.provider_reference AS providerReference,p.created_at AS createdAt,p.paid_at AS paidAt,u.email FROM payments p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 200`).all(),
    portalEnv.DB.prepare(`SELECT ae.id,ae.event,ae.entity_type AS entityType,ae.entity_id AS entityId,ae.metadata_json AS metadataJson,ae.created_at AS createdAt,u.email AS actorEmail FROM audit_events ae LEFT JOIN users u ON u.id=ae.actor_user_id ORDER BY ae.created_at DESC LIMIT 100`).all(),
    portalEnv.DB.prepare(`SELECT a.id,a.role,u.email FROM admins a JOIN users u ON u.id=a.user_id WHERE a.status='active' ORDER BY u.email`).all(),
    portalEnv.DB.prepare(`SELECT ar.id,ar.public_id AS publicId,ar.status,ar.requested_start AS requestedStart,ar.duration_minutes AS durationMinutes,ar.timezone,ar.applicant_note AS applicantNote,ar.confirmed_start AS confirmedStart,ar.meeting_url AS meetingUrl,ar.admin_note AS adminNote,ar.provider,ar.cancel_url AS cancelUrl,ar.reschedule_url AS rescheduleUrl,ar.completed_at AS completedAt,ar.created_at AS createdAt,ar.updated_at AS updatedAt,a.public_id AS applicationPublicId,u.email FROM appointment_requests ar JOIN applications a ON a.id=ar.application_id JOIN users u ON u.id=ar.user_id ORDER BY CASE ar.status WHEN 'requested' THEN 1 WHEN 'confirmed' THEN 2 WHEN 'rescheduled' THEN 3 ELSE 4 END,coalesce(ar.confirmed_start,ar.requested_start) ASC LIMIT 200`).all(),
  ]);
  return json({ metrics, applications: applications.results, payments: payments.results, activity: activity.results, admins: admins.results, appointments: appointments.results });
}
