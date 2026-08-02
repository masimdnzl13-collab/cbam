import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type ActivityData, type Installation, type ImporterRequest, type Organization, type Precursor, type ProductionProcess, type Product, type SupplierRequest } from "@/lib/types";
import { findMissingDataActions } from "@/lib/dashboard/completeness";
import { CBAM_CALENDAR_EVENTS } from "@/lib/dashboard/calendar";
import { sendEmail } from "@/lib/email/resend";
import {
  activityDataReminderEmail,
  importerRequestDeadlineEmail,
  regulatoryCountdownEmail,
  supplierReminderEmail,
  trialEndingEmail,
  welcomeEmail1,
  welcomeEmail2,
  welcomeEmail3,
} from "@/lib/email/templates";
import { toDate } from "@/lib/utils";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { logServerError } from "@/lib/errors/log-error";

export const dynamic = "force-dynamic";

const REMINDER_MILESTONES = [90, 30, 7];
const REQUEST_MILESTONES = [7, 3, 1];

function daysBetween(from: number, to: number): number {
  return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
  const adminDb = getAdminDb();
  const now = Date.now();
  const currentYear = new Date().getFullYear();

  const orgsSnap = await adminDb.collection(COLLECTIONS.organizations).get();
  let trialExpirations = 0;
  let missingDataReminders = 0;
  let requestDeadlineAlerts = 0;
  let supplierReminders = 0;

  for (const orgDoc of orgsSnap.docs) {
    const org = { id: orgDoc.id, ...(orgDoc.data() as Omit<Organization, "id">) };

    if (org.subscriptionStatus === "trialing" && org.trialEndsAt && org.trialEndsAt < now) {
      await orgDoc.ref.update({ subscriptionStatus: "canceled", updatedAt: now });
      const { subject, html } = trialEndingEmail();
      await sendEmail({ to: org.contactEmail, subject, html });
      trialExpirations++;
    }

    // Hoş geldin serisi: kayıt (createdAt) sonrası gün 0 / gün 2 / gün 5
    const ageDays = daysBetween(toDate(org.createdAt).getTime(), now);
    const step = org.welcomeSeriesStep ?? 0;
    if (step < 1 && ageDays >= 0) {
      const { subject, html } = welcomeEmail1();
      await sendEmail({ to: org.contactEmail, subject, html });
      await orgDoc.ref.update({ welcomeSeriesStep: 1 });
    } else if (step < 2 && ageDays >= 2) {
      const { subject, html } = welcomeEmail2();
      await sendEmail({ to: org.contactEmail, subject, html });
      await orgDoc.ref.update({ welcomeSeriesStep: 2 });
    } else if (step < 3 && ageDays >= 5) {
      const { subject, html } = welcomeEmail3();
      await sendEmail({ to: org.contactEmail, subject, html });
      await orgDoc.ref.update({ welcomeSeriesStep: 3 });
    }

    const [installationsSnap, processesSnap, productsSnap, activitySnap, precursorsSnap, requestsSnap, supplierRequestsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.installations).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.productionProcesses).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.products).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.activityData).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.precursors).where("organizationId", "==", org.id).get(),
      adminDb.collection(COLLECTIONS.importerRequests).where("organizationId", "==", org.id).where("status", "==", "acik").get(),
      adminDb
        .collection(COLLECTIONS.supplierRequests)
        .where("organizationId", "==", org.id)
        .where("status", "in", ["gonderildi", "goruntulendi"])
        .get(),
    ]);

    const missing = findMissingDataActions({
      installations: installationsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Installation, "id">) })),
      processes: processesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProductionProcess, "id">) })),
      products: productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) })),
      activityData: activitySnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityData, "id">) })),
      precursors: precursorsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Precursor, "id">) })),
    });

    if (missing.length > 0) {
      const { subject, html } = activityDataReminderEmail(currentYear);
      await sendEmail({ to: org.contactEmail, subject, html });
      missingDataReminders++;
    }

    const requests = requestsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImporterRequest, "id">) }));
    for (const reqDoc of requests) {
      const daysLeft = daysBetween(now, reqDoc.dueDate);
      if (REQUEST_MILESTONES.includes(daysLeft)) {
        const { subject, html } = importerRequestDeadlineEmail(reqDoc.customerName, daysLeft);
        await sendEmail({ to: org.contactEmail, subject, html });
        requestDeadlineAlerts++;
      }
    }

    // Tedarikçiye yanıtsız taleplerde 7. ve 14. gün otomatik nazik hatırlatma
    for (const supDoc of supplierRequestsSnap.docs) {
      const sup = { id: supDoc.id, ...(supDoc.data() as Omit<SupplierRequest, "id">) };
      const ageDays = daysBetween(toDate(sup.sentAt).getTime(), now);
      if (ageDays === 7 && !sup.reminderSentAt7) {
        const { subject, html } = supplierReminderEmail({
          organizationName: sup.organizationName,
          supplierName: sup.supplierName,
          precursorName: sup.precursorName,
          portalUrl: `${req.nextUrl.origin}/tedarikci/${sup.token}`,
          daysAgo: 7,
        });
        await sendEmail({ to: sup.supplierEmail, subject, html });
        await supDoc.ref.update({ reminderSentAt7: now });
        supplierReminders++;
      } else if (ageDays === 14 && !sup.reminderSentAt14) {
        const { subject, html } = supplierReminderEmail({
          organizationName: sup.organizationName,
          supplierName: sup.supplierName,
          precursorName: sup.precursorName,
          portalUrl: `${req.nextUrl.origin}/tedarikci/${sup.token}`,
          daysAgo: 14,
        });
        await sendEmail({ to: sup.supplierEmail, subject, html });
        await supDoc.ref.update({ reminderSentAt14: now });
        supplierReminders++;
      }
    }
  }

  for (const event of CBAM_CALENDAR_EVENTS) {
    const daysLeft = daysBetween(now, new Date(event.date).getTime());
    if (REMINDER_MILESTONES.includes(daysLeft)) {
      for (const orgDoc of orgsSnap.docs) {
        const org = orgDoc.data() as Organization;
        const { subject, html } = regulatoryCountdownEmail(event.label, daysLeft);
        await sendEmail({ to: org.contactEmail, subject, html });
      }
    }
  }

  await sendTelegramMessage(
    `🔎 <b>Günlük kontrol tamamlandı</b>\nOrganizasyon: ${orgsSnap.size}\nDeneme bitişi: ${trialExpirations}\nEksik veri hatırlatması: ${missingDataReminders}\nTermin uyarısı: ${requestDeadlineAlerts}\nTedarikçi hatırlatması: ${supplierReminders}`
  );

  return NextResponse.json({
    organizations: orgsSnap.size,
    trialExpirations,
    missingDataReminders,
    requestDeadlineAlerts,
    supplierReminders,
  });
  } catch (err) {
    await logServerError("cron:daily-check", err);
    return NextResponse.json({ error: "Günlük kontrol sırasında hata oluştu" }, { status: 500 });
  }
}
