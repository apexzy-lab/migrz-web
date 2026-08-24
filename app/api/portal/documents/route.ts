import { audit, json, portalEnv, randomId, requireSession } from "@/app/portal/server";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]); const maxBytes = 10 * 1024 * 1024;

export async function GET(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  const result = await portalEnv.DB.prepare("SELECT id,file_name AS fileName,content_type AS contentType,size,status,security_status AS securityStatus,created_at AS createdAt FROM documents WHERE user_id=? AND status!='deleted' ORDER BY created_at DESC").bind(session.user.id).all(); return json({ documents: result.results });
}

export async function POST(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!;
  try {
    const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return json({ error: "Choose a document to upload." }, 400); if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > maxBytes) return json({ error: "Upload a PDF, JPG or PNG no larger than 10 MB." }, 400);
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer()); const validSignature = file.type === "application/pdf" ? new TextDecoder().decode(signature.slice(0, 5)) === "%PDF-" : file.type === "image/png" ? signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47 : signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
    if (!validSignature) { await audit("document_quarantined", "document", null, session.user.id, { reason: "signature_mismatch", contentType: file.type, size: file.size }); return json({ error: "This file failed the security check. Export it again as a genuine PDF, JPG or PNG." }, 400); }
    const application = await portalEnv.DB.prepare("SELECT id FROM applications WHERE user_id=? LIMIT 1").bind(session.user.id).first<{ id: string }>(); if (!application) return json({ error: "Start your assessment before uploading documents." }, 400);
    const documentId = randomId("doc_"); const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg"; const key = `${session.user.id}/${application.id}/${documentId}.${extension}`; const content = await file.arrayBuffer(); const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", content))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    await portalEnv.DOCUMENTS.put(key, content, { httpMetadata: { contentType: file.type }, customMetadata: { owner: session.user.id, documentId, sha256: digest } });
    await portalEnv.DB.prepare("INSERT INTO documents (id,user_id,application_id,r2_key,file_name,content_type,size,status,security_status,sha256,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(documentId, session.user.id, application.id, key, file.name.slice(0, 240), file.type, file.size, "stored", "validated", digest, Date.now()).run(); await audit("document_uploaded", "document", documentId, session.user.id, { size: file.size, contentType: file.type, sha256: digest }); return json({ document: { id: documentId, fileName: file.name, contentType: file.type, size: file.size, status: "stored", securityStatus: "validated" } }, 201);
  } catch { return json({ error: "Unable to upload the document." }, 500); }
}

export async function DELETE(request: Request) {
  const session = await requireSession(request, true); if (session.error || !session.user) return session.error!; const id = new URL(request.url).searchParams.get("id") || ""; const document = await portalEnv.DB.prepare("SELECT id,r2_key AS r2Key FROM documents WHERE id=? AND user_id=? AND status!='deleted' LIMIT 1").bind(id, session.user.id).first<{ id: string; r2Key: string }>(); if (!document) return json({ error: "Document not found." }, 404);
  await portalEnv.DOCUMENTS.delete(document.r2Key); await portalEnv.DB.prepare("UPDATE documents SET status='deleted' WHERE id=?").bind(id).run(); await audit("document_deleted", "document", id, session.user.id); return json({ ok: true });
}
