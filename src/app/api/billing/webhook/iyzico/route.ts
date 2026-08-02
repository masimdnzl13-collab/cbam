import { NextRequest, NextResponse } from "next/server";
import { billingProvider } from "@/lib/billing";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/types";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!billingProvider.verifyWebhookSignature(rawBody, req.headers)) {
    return NextResponse.json({ error: "Geçersiz imza" }, { status: 401 });
  }

  const event = billingProvider.parseWebhookEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "Olay ayrıştırılamadı" }, { status: 400 });
  }

  const adminDb = getAdminDb();
  const orgRef = adminDb.collection(COLLECTIONS.organizations).doc(event.organizationId);
  const orgSnap = await orgRef.get();
  const orgName = orgSnap.exists ? (orgSnap.data()?.name as string) : event.organizationId;

  switch (event.type) {
    case "subscription.created":
      await orgRef.update({
        subscriptionPlan: event.planId,
        subscriptionStatus: "active",
        billingInterval: event.interval,
        providerSubscriptionId: event.providerSubscriptionId,
        pastDueSince: null,
        updatedAt: Date.now(),
      });
      await sendTelegramMessage(`🎉 <b>Yeni abonelik</b>\n${orgName} → ${event.planId} (${event.interval})`);
      break;

    case "subscription.canceled":
      await orgRef.update({ subscriptionStatus: "canceled", updatedAt: Date.now() });
      await sendTelegramMessage(`⚠️ <b>Abonelik iptali</b>\n${orgName}`);
      break;

    case "payment.failed":
      await orgRef.update({ subscriptionStatus: "past_due", pastDueSince: Date.now(), updatedAt: Date.now() });
      await sendTelegramMessage(`🔴 <b>Ödeme hatası</b>\n${orgName} — 7 günlük esneme süresi başladı`);
      break;

    case "payment.succeeded":
      await orgRef.update({ subscriptionStatus: "active", pastDueSince: null, updatedAt: Date.now() });
      break;
  }

  return NextResponse.json({ ok: true });
}
