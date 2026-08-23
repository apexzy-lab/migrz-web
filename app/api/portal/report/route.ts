import { json, portalEnv, requireSession } from "@/app/portal/server";

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const report = await portalEnv.DB.prepare("SELECT r.r2_key AS r2Key,r.file_name AS fileName,r.content_type AS contentType FROM assessment_reports r JOIN applications a ON a.id=r.application_id WHERE r.id=? AND r.user_id=? AND a.user_id=? AND r.status='published' LIMIT 1")
    .bind(new URL(request.url).searchParams.get("id") || "", session.user.id, session.user.id).first<{ r2Key: string; fileName: string; contentType: string }>();
  if (!report) return json({ error: "Report not found" }, 404); const object = await portalEnv.DOCUMENTS.get(report.r2Key); if (!object) return json({ error: "Report file unavailable" }, 404);
  return new Response(object.body, { headers: { "content-type": report.contentType, "content-disposition": `attachment; filename="${report.fileName.replace(/["\\]/g, "")}"`, "cache-control": "private, no-store" } });
}
