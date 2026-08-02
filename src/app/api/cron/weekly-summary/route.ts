import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  COLLECTIONS,
  type ActivityData,
  type Installation,
  type Organization,
  type Precursor,
  type ProductionProcess,
  type Product,
} from "@/lib/types";
import { calcOverallCompleteness, findMissingDataActions } from "@/lib/dashboard/completeness";
import { sendEmail } from "@/lib/email/resend";
import { weeklySummaryEmail } from "@/lib/email/templates";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const orgsSnap = await adminDb.collection(COLLECTIONS.organizations).get();
  let sent = 0;

  for (const orgDoc of orgsSnap.docs) {
    const org = { id: orgDoc.id, ...(orgDoc.data() as Omit<Organization, "id">) };

    const [installationsSnap, processesSnap, productsSnap, activitySnap, precursorsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.installations).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.productionProcesses).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.products).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.activityData).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.precursors).where("organizationId", "==", org.id).get(),
    ]);

    const input = {
      installations: installationsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })),
      processes: processesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })),
      products: productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })),
      activityData: activitySnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) })),
      precursors: precursorsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) })),
    };

    if (input.installations.length === 0) continue; // henüz onboarding'i tamamlamamış

    const completeness = calcOverallCompleteness(input);
    const missing = findMissingDataActions(input);
    const previous = org.lastWeeklyCompletenessPercent ?? completeness.overallPercent;
    const delta = completeness.overallPercent - previous;

    const { subject, html } = weeklySummaryEmail({
      organizationName: org.name,
      completenessPercent: completeness.overallPercent,
      completenessDelta: delta,
      openActionsCount: missing.length,
    });
    await sendEmail({ to: org.contactEmail, subject, html });
    await orgDoc.ref.update({ lastWeeklyCompletenessPercent: completeness.overallPercent });
    sent++;
  }

  await sendTelegramMessage(`📬 <b>Haftalık özet gönderildi</b>\n${sent} organizasyona e-posta iletildi.`);

  return NextResponse.json({ sent });
}
