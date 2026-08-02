import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const adminDb = getAdminDb();
  const ref = adminDb.collection(COLLECTIONS.supplierRequests).doc(params.token);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }
  const request = snap.data() as { organizationId: string };

  const formData = await req.formData();
  const mode = formData.get("mode") as string;
  const file = formData.get("file");

  const update: Record<string, unknown> = {
    respondedAt: Date.now(),
    updatedAt: Date.now(),
  };

  if (mode === "decline") {
    update.status = "reddedildi";
    update.declineReason = String(formData.get("declineReason") ?? "");
  } else {
    update.status = "yanitlandi";
    update.declaredValue = Number(formData.get("declaredValue") ?? 0);
    update.declaredMethod = String(formData.get("declaredMethod") ?? "");

    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const storagePath = `org/${request.organizationId}/supplier_requests/${Date.now()}-${file.name}`;
      const bucket = getAdminStorage().bucket();
      await bucket.file(storagePath).save(buffer, { contentType: file.type });

      const docRef = await adminDb.collection(COLLECTIONS.documents).add({
        organizationId: request.organizationId,
        storagePath,
        fileName: file.name,
        relatedCollection: COLLECTIONS.supplierRequests,
        relatedId: params.token,
        uploadedBy: "tedarikci-portali",
        docType: "tedarikci_beyani",
        createdAt: Date.now(),
      });
      update.documentId = docRef.id;
    }
  }

  await ref.update(update);
  return NextResponse.json({ ok: true });
}
