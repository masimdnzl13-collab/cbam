import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { checkDocumentReliability } from "@/lib/ai/document-check";
import { COLLECTIONS } from "@/lib/types";
import { logServerError } from "@/lib/errors/log-error";

export const dynamic = "force-dynamic";

const SUPPORTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentId, expectedDocTypeDescription, expectedPeriodYear, expectedAmount, expectedUnit } = body as {
    documentId: string;
    expectedDocTypeDescription: string;
    expectedPeriodYear: number;
    expectedAmount?: number;
    expectedUnit?: string;
  };

  if (!documentId) {
    return NextResponse.json({ error: "documentId gerekli" }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    const docSnap = await adminDb.collection(COLLECTIONS.documents).doc(documentId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
    }
    const docData = docSnap.data() as { storagePath: string; mimeType?: string; organizationId: string };
    if (!docData.mimeType || !SUPPORTED_TYPES.includes(docData.mimeType)) {
      return NextResponse.json({ skipped: true });
    }

    const bucket = getAdminStorage().bucket();
    const [buffer] = await bucket.file(docData.storagePath).download();
    const base64 = buffer.toString("base64");

    const result = await checkDocumentReliability({
      base64,
      mediaType: docData.mimeType as "application/pdf" | "image/jpeg" | "image/png" | "image/webp",
      expectedDocTypeDescription,
      expectedPeriodYear,
      expectedAmount,
      expectedUnit,
    });

    await adminDb.collection(COLLECTIONS.documentChecks).doc(documentId).set({
      organizationId: docData.organizationId,
      documentId,
      status: result.status,
      typeMatches: result.typeMatches,
      periodMatches: result.periodMatches,
      amountMatches: result.amountMatches,
      unitMatches: result.unitMatches,
      explanationTr: result.explanationTr,
      checkedAt: Date.now(),
    });

    return NextResponse.json({ result });
  } catch (err) {
    await logServerError("ai:check-document", err);
    return NextResponse.json({ error: "Belge kontrolü başarısız oldu" }, { status: 500 });
  }
}
