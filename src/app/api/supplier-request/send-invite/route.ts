import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { supplierInviteEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { organizationName, supplierName, supplierEmail, precursorName, token } = body as {
    organizationName: string;
    supplierName: string;
    supplierEmail: string;
    precursorName: string;
    token: string;
  };

  if (!supplierEmail || !token) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const portalUrl = `${req.nextUrl.origin}/tedarikci/${token}`;
  const { subject, html } = supplierInviteEmail({ organizationName, supplierName, precursorName, portalUrl });
  await sendEmail({ to: supplierEmail, subject, html });

  return NextResponse.json({ ok: true, portalUrl });
}
