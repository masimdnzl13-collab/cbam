const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Kritik olayları (yeni abonelik, iptal, ödeme hatası, eksik veri taraması vb.)
// Telegram'a düşürmek için tek nokta. Env değişkenleri yoksa sessizce atlar —
// bildirim altyapısı olmadan diğer akışlar bloklanmamalı.
export async function sendTelegramMessage(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Bildirim gönderimi best-effort'tur, başarısızlık ana akışı etkilememeli.
  }
}
