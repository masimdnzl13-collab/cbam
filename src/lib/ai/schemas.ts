import { z } from "zod";

// P8: PDF'ten (elektrik faturası / yakıt irsaliyesi vb.) veri çıkarma.
// Çıkarılan değerler ASLA doğrudan kaydedilmez — her zaman kullanıcı onayına
// sunulan düzenlenebilir bir form olarak gösterilir.
export const DocumentExtractionSchema = z.object({
  documentType: z.enum([
    "elektrik_faturasi",
    "yakit_irsaliyesi",
    "tedarikci_beyani",
    "karbon_odeme_belgesi",
    "diger",
  ]),
  periodStart: z.string().nullable().describe("ISO tarih (YYYY-MM-DD), bulunamazsa null"),
  periodEnd: z.string().nullable().describe("ISO tarih (YYYY-MM-DD), bulunamazsa null"),
  quantity: z.number().nullable().describe("Belgedeki ana miktar (ör. kWh, ton, m3), bulunamazsa null"),
  unit: z.string().nullable().describe("Miktarın birimi (ör. kWh, MWh, ton, kg, m3, litre)"),
  supplierName: z.string().nullable().describe("Tedarikçi / fatura kesen firma adı"),
  confidence: z.enum(["yuksek", "orta", "dusuk"]).describe("Çıkarımın genel güven seviyesi"),
  notes: z.string().nullable().describe("Belirsizlik veya dikkat çeken bir nokta varsa kısa Türkçe not"),
});
export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

// P18-1: Belge kontrolü — beklenen bağlamla (tür, dönem, miktar, birim) çapraz kontrol.
export const DocumentCheckResultSchema = z.object({
  status: z.enum(["yesil", "sari", "kirmizi"]).describe(
    "yesil: tüm kontroller tutarlı, sari: küçük tutarsızlık/belirsizlik, kirmizi: ciddi uyuşmazlık"
  ),
  typeMatches: z.boolean().describe("Belge türü beklenen türle uyuşuyor mu"),
  periodMatches: z.boolean().describe("Belgedeki tarih aralığı raporlama dönemine düşüyor mu"),
  amountMatches: z.boolean().describe("Belgedeki miktar, beklenen miktarla (varsa) tutarlı mı"),
  unitMatches: z.boolean().describe("Birim beklenen birimle uyuşuyor mu (ör. kWh vs MWh farkı)"),
  explanationTr: z.string().describe("Bulguların düz, teknik olmayan Türkçe açıklaması (2-4 cümle)"),
});
export type DocumentCheckResult = z.infer<typeof DocumentCheckResultSchema>;

// P18-2: Dönem kilitleme ön kontrolü — mantık/tutarlılık taraması.
export const LogicAuditFindingSchema = z.object({
  severity: z.enum(["bilgi", "uyari", "kritik"]),
  titleTr: z.string().describe("Kısa başlık"),
  descriptionTr: z.string().describe("Bulgunun düz Türkçe açıklaması ve neden şüpheli olduğu"),
});

export const LogicAuditResultSchema = z.object({
  findings: z.array(LogicAuditFindingSchema),
  overallAssessmentTr: z.string().describe("Genel değerlendirme, 1-2 cümle"),
});
export type LogicAuditResult = z.infer<typeof LogicAuditResultSchema>;

// P18-3: Dönemler arası anomali açıklaması taslağı.
export const AnomalyExplanationSchema = z.object({
  summaryTr: z.string().describe("Değişimi özetleyen, insan diliyle yazılmış 2-4 cümlelik açıklama"),
  likelyCausesTr: z.array(z.string()).describe("Olası nedenler, madde madde"),
});
export type AnomalyExplanationDraft = z.infer<typeof AnomalyExplanationSchema>;
