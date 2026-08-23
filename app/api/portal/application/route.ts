import { audit, json, portalEnv, randomId, requireSession, submissionPublicId } from "@/app/portal/server";
import { supportedDestinations } from "@/app/portal/options";

const allowedFields = ["fullName", "countryResidence", "preferredDestination", "immigrationGoal", "currentRole", "experienceRange", "achievement"] as const;

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT id,public_id AS publicId,status,review_status AS reviewStatus,current_section AS currentSection,answers_json AS answersJson,updated_at AS updatedAt,submitted_at AS submittedAt,review_due_at AS reviewDueAt,report_published_at AS reportPublishedAt,casevault_status AS casevaultStatus FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; publicId: string; status: string; reviewStatus: string; currentSection: number; answersJson: string; updatedAt: number; submittedAt: number | null; reviewDueAt: number | null; reportPublishedAt: number | null; casevaultStatus: string }>();
  return json({ application: application ? { ...application, answers: JSON.parse(application.answersJson || "{}"), answersJson: undefined } : null });
}

export async function PUT(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  try {
    const body = await request.json() as { currentSection?: unknown; answers?: Record<string, unknown> }; const currentSection = Number(body.currentSection); if (!Number.isInteger(currentSection) || currentSection < 1 || currentSection > 4 || !body.answers || typeof body.answers !== "object") return json({ error: "Invalid application update." }, 400);
    const clean: Record<string, string> = {}; for (const field of allowedFields) { const value = body.answers[field]; if (typeof value === "string") clean[field] = value.trim().slice(0, field === "immigrationGoal" || field === "achievement" ? 4000 : 300); }
    if (clean.preferredDestination && !supportedDestinations.some((country) => country === clean.preferredDestination)) return json({ error: "Select a destination currently supported by Migrz." }, 400);
    const now = Date.now(); const existing = await portalEnv.DB.prepare("SELECT id,status FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; status: string }>(); if (existing?.status === "submitted") return json({ error: "Submitted assessments cannot be edited." }, 409);
    const id = existing?.id || randomId("app_");
    if (existing) await portalEnv.DB.prepare("UPDATE applications SET current_section=?,answers_json=?,updated_at=? WHERE id=?").bind(currentSection, JSON.stringify(clean), now, id).run(); else await portalEnv.DB.prepare("INSERT INTO applications (id,user_id,public_id,status,review_status,current_section,answers_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, session.user.id, submissionPublicId(), "draft", "draft", currentSection, JSON.stringify(clean), now, now).run();
    await audit("application_saved", "application", id, session.user.id, { currentSection }); return json({ ok: true, updatedAt: now });
  } catch { return json({ error: "Unable to save the assessment." }, 500); }
}

export async function POST(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const application = await portalEnv.DB.prepare("SELECT id,answers_json AS answersJson,status FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string; answersJson: string; status: string }>(); if (!application) return json({ error: "Complete the assessment before submitting." }, 400); if (application.status === "submitted") return json({ ok: true });
  const answers = JSON.parse(application.answersJson || "{}") as Record<string, string>; const required = ["fullName", "countryResidence", "preferredDestination", "immigrationGoal", "currentRole", "experienceRange", "achievement"]; if (required.some((field) => !answers[field]?.trim())) return json({ error: "Complete all required assessment questions before submitting." }, 400); if (!supportedDestinations.some((country) => country === answers.preferredDestination)) return json({ error: "Select a destination currently supported by Migrz." }, 400);
  const now = Date.now(); const plan = session.user.paidPlan || "standard"; const reviewDueAt = plan === "accelerated" ? now + 12 * 60 * 60 * 1000 : now + 48 * 60 * 60 * 1000; const retentionUntil = now + 7 * 365 * 24 * 60 * 60 * 1000;
  await portalEnv.DB.prepare("UPDATE applications SET status='submitted',review_status='submitted',current_section=4,submitted_at=?,review_due_at=?,retention_until=?,updated_at=? WHERE id=?").bind(now, reviewDueAt, retentionUntil, now, application.id).run(); await audit("application_submitted", "application", application.id, session.user.id, { plan, reviewDueAt }); const submitted = await portalEnv.DB.prepare("SELECT public_id AS publicId FROM applications WHERE id=?").bind(application.id).first<{ publicId: string }>(); return json({ ok: true, submittedAt: now, publicId: submitted?.publicId, reviewDueAt });
}
