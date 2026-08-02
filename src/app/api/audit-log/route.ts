import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace("Bearer ", "");
  if (!idToken) {
    return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
  }

  const userSnap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }
  const userData = userSnap.data() as { organizationId: string; email: string };

  const body = await req.json();
  const { action, collection, documentId, changeSummary } = body as {
    action: string;
    collection: string;
    documentId: string;
    changeSummary?: string;
  };

  if (!action || !collection || !documentId) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const entry = {
    organizationId: userData.organizationId,
    userId: uid,
    userEmail: userData.email,
    action,
    collection,
    documentId,
    changeSummary: changeSummary ?? null,
    createdAt: Date.now(),
  };

  const ref = await adminDb.collection(COLLECTIONS.auditLog).add(entry);
  return NextResponse.json({ id: ref.id });
}
