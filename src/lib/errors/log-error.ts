import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";

export async function logServerError(source: string, error: unknown): Promise<void> {
  try {
    const adminDb = getAdminDb();
    await adminDb.collection(COLLECTIONS.errorLogs).add({
      source,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack ?? null : null,
      createdAt: Date.now(),
    });
  } catch {
    // hata kaydı best-effort'tur; kayıt başarısız olursa sessizce yutulur
  }
}
