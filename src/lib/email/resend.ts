import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "KarbonRota <bildirim@karbonrota.com>";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const resend = getClient();
  if (!resend) return; // API anahtarı yoksa sessizce atla — e-posta altyapısı olmadan diğer akışlar bloklanmamalı
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
