import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CalculatorLeadEntry, type Organization, type WaitlistEntry } from "@/lib/types";
import { PLAN_CONFIG } from "@/lib/billing/plans-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Geçersiz oturum" }, { status: 401 });
  }

  if (!process.env.SUPERADMIN_UID || uid !== process.env.SUPERADMIN_UID) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const adminDb = getAdminDb();
  const [orgsSnap, waitlistSnap, leadsSnap, errorsSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.organizations).get(),
    adminDb.collection(COLLECTIONS.waitlist).orderBy("createdAt", "desc").limit(200).get(),
    adminDb.collection(COLLECTIONS.calculatorLeads).orderBy("createdAt", "desc").limit(200).get(),
    adminDb.collection(COLLECTIONS.errorLogs).orderBy("createdAt", "desc").limit(50).get(),
  ]);

  const organizations = orgsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Organization, "id">) }));
  const waitlist = waitlistSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WaitlistEntry, "id">) }));
  const leads = leadsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalculatorLeadEntry, "id">) }));
  const errors = errorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const leadsBySector: Record<string, { count: number; totalTon: number }> = {};
  for (const lead of leads) {
    if (!leadsBySector[lead.sector]) leadsBySector[lead.sector] = { count: 0, totalTon: 0 };
    leadsBySector[lead.sector].count++;
    leadsBySector[lead.sector].totalTon += lead.annualExportTon ?? 0;
  }

  let monthlyRecurringRevenueEur = 0;
  for (const org of organizations) {
    if (org.subscriptionStatus !== "active") continue;
    if (org.subscriptionPlan === "deneme" || org.subscriptionPlan === "kurumsal") continue;
    const plan = PLAN_CONFIG[org.subscriptionPlan];
    const monthly = org.billingInterval === "yearly" ? (plan.yearlyPriceEur ?? 0) / 12 : plan.monthlyPriceEur ?? 0;
    monthlyRecurringRevenueEur += monthly;
  }

  return NextResponse.json({
    organizations,
    waitlist,
    leads,
    leadsBySector,
    errors,
    monthlyRecurringRevenueEur,
  });
}
