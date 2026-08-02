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

  await ref.update({
    status: "onaylandi",
    acknowledgedAt: Date.now(),
    updatedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
