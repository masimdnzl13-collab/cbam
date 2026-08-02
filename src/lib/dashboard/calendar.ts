export interface CalendarEvent {
  date: string; // ISO date
  label: string;
  note: string;
  tone: "accent" | "warning" | "steel";
}

// Not: çeyrek sonu %50 sertifika kontrol tarihleri ithalatçının kendi
// yükümlülüğüdür; burada gösterilme amacı, Türk üreticinin AB müşterisinden
// gelecek veri talebi dalgasının bu tarihlerden hemen önce yoğunlaşacağını
// öngörmesini sağlamaktır (tahmini tarihler, resmi teyit gerektirir).
export const CBAM_CALENDAR_EVENTS: CalendarEvent[] = [
  { date: "2027-02-01", label: "CBAM sertifika satışları başlıyor", note: "Mali yükümlülük dönemi resmen başlıyor.", tone: "accent" },
  { date: "2027-03-31", label: "Ç1 %50 sertifika kontrolü (tahmini)", note: "İthalatçı talep dalgası bekle.", tone: "warning" },
  { date: "2027-06-30", label: "Ç2 %50 sertifika kontrolü (tahmini)", note: "İthalatçı talep dalgası bekle.", tone: "warning" },
  { date: "2027-09-30", label: "İlk yıllık CBAM beyanı", note: "2026 dönemine ait ilk yıllık beyan son tarihi.", tone: "accent" },
  { date: "2027-12-31", label: "Ç4 %50 sertifika kontrolü (tahmini)", note: "İthalatçı talep dalgası bekle.", tone: "warning" },
];

export function getNextCriticalDate(from: Date = new Date()): CalendarEvent | null {
  const upcoming = CBAM_CALENDAR_EVENTS.filter((e) => new Date(e.date).getTime() > from.getTime()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return upcoming[0] ?? null;
}
