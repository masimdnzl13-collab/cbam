import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { supplierReminderEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { organizationName, supplierName, supplierEmail, precursorName, token, daysAgo } = body as {
    organizationName: string;
    supplierName: string;
    supplierEmail: string;
    precursorName: string;
    token: string;
    daysAgo: number;
  };

  if (!supplierEmail || !token) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const portalUrl = `${req.nextUrl.origin}/tedarikci/${token}`;
  const { subject, html } = supplierReminderEmail({ organizationName, supplierName, precursorName, portalUrl, daysAgo });
  await sendEmail({ to: supplierEmail, subject, html });

  return NextResponse.json({ ok: true });
}
