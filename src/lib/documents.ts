import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/types";

export async function uploadDocument(params: {
  organizationId: string;
  file: File;
  relatedCollection: string;
  relatedId: string;
  uploadedBy: string;
  installationId?: string;
  periodYear?: number;
  docType?: string;
  // P18-1: belge kontrolü için beklenen bağlam (varsa arka planda tetiklenir)
  expectedDocTypeDescription?: string;
  expectedAmount?: number;
  expectedUnit?: string;
}): Promise<string> {
  const {
    organizationId,
    file,
    relatedCollection,
    relatedId,
    uploadedBy,
    installationId,
    periodYear,
    docType,
    expectedDocTypeDescription,
    expectedAmount,
    expectedUnit,
  } = params;
  const storagePath = `org/${organizationId}/${relatedCollection}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, COLLECTIONS.documents), {
    organizationId,
    storagePath,
    fileName: file.name,
    relatedCollection,
    relatedId,
    uploadedBy,
    installationId: installationId ?? null,
    periodYear: periodYear ?? null,
    docType: docType ?? relatedCollection,
    mimeType: file.type,
    createdAt: serverTimestamp(),
  });

  if (expectedDocTypeDescription && ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    fetch("/api/ai/check-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: docRef.id,
        expectedDocTypeDescription,
        expectedPeriodYear: periodYear ?? new Date().getFullYear(),
        expectedAmount,
        expectedUnit,
      }),
    }).catch(() => {
      // belge kontrolü best-effort'tur — başarısız olursa yükleme akışını etkilemez
    });
  }

  return docRef.id;
}
