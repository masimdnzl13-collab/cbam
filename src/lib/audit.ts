import { auth } from "@/lib/firebase";

export async function logAudit(params: {
  action: string;
  collection: string;
  documentId: string;
  changeSummary?: string;
}) {
  const user = auth.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  try {
    await fetch("/api/audit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(params),
    });
  } catch {
    // audit logging is best-effort; it should never block the user's action
  }
}
