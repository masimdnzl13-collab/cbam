import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  const adminDb = getAdminDb();
  const ref = adminDb.collection(COLLECTIONS.importerPackages).doc(params.token);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
  }

  const data = snap.data();
  const nextStatus = data?.status === "gonderildi" ? "goruntulendi" : data?.status;

  await ref.update({
    viewCount: (data?.viewCount ?? 0) + 1,
    lastViewedAt: Date.now(),
    status: nextStatus,
    updatedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
