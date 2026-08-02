import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const adminDb = getAdminDb();
  const ref = adminDb.collection(COLLECTIONS.supplierRequests).doc(params.token);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }

  const data = snap.data();
  const update: Record<string, unknown> = { updatedAt: Date.now() };
  if (data?.status === "gonderildi") {
    update.status = "goruntulendi";
    update.viewedAt = Date.now();
  }
  await ref.update(update);

  const updated = await ref.get();
  return NextResponse.json({ id: updated.id, ...updated.data() });
}
