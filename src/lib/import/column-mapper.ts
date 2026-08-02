// P8 revizyonu: Excel/CSV eşleme ekranı için sütun otomatik tanıma.
// Sistem, yüklenen dosyanın başlıklarını bilinen alan adlarıyla (ve
// eşanlamlılarıyla) karşılaştırıp en iyi tahmini eşlemeyi önerir; emin
// olamadığı alanlarda kullanıcıya soru işareti bırakır (null döner).

export interface TargetField {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
}

export const FUEL_TARGET_FIELDS: TargetField[] = [
  { key: "processName", label: "Proses Adı", required: true, synonyms: ["proses", "proses adı", "tesis", "process"] },
  { key: "fuelType", label: "Yakıt Türü", required: true, synonyms: ["yakıt", "yakıt türü", "yakit turu", "fuel"] },
  { key: "quantity", label: "Miktar", required: true, synonyms: ["miktar", "tüketim", "quantity", "amount"] },
  { key: "unit", label: "Birim", required: true, synonyms: ["birim", "unit"] },
  { key: "dataQuality", label: "Veri Kalitesi", required: false, synonyms: ["veri kalitesi", "kalite", "quality"] },
];

export const ELECTRICITY_TARGET_FIELDS: TargetField[] = [
  { key: "processName", label: "Proses Adı", required: true, synonyms: ["proses", "proses adı", "tesis"] },
  { key: "quantity", label: "Toplam Tüketim", required: true, synonyms: ["tüketim", "toplam tüketim", "miktar", "consumption"] },
  { key: "unit", label: "Birim", required: true, synonyms: ["birim", "unit"] },
  { key: "sourceType", label: "Kaynak Tipi", required: true, synonyms: ["kaynak", "kaynak tipi", "source"] },
  { key: "dataQuality", label: "Veri Kalitesi", required: false, synonyms: ["veri kalitesi", "kalite"] },
];

export const MATERIAL_TARGET_FIELDS: TargetField[] = [
  { key: "processName", label: "Proses Adı", required: true, synonyms: ["proses", "proses adı", "tesis"] },
  { key: "materialName", label: "Malzeme Adı", required: true, synonyms: ["malzeme", "malzeme adı", "hammadde", "material"] },
  { key: "quantity", label: "Miktar", required: true, synonyms: ["miktar", "quantity"] },
  { key: "unit", label: "Birim", required: true, synonyms: ["birim", "unit"] },
  { key: "dataQuality", label: "Veri Kalitesi", required: false, synonyms: ["veri kalitesi", "kalite"] },
];

export const OUTPUT_TARGET_FIELDS: TargetField[] = [
  { key: "processName", label: "Proses Adı", required: true, synonyms: ["proses", "proses adı", "tesis"] },
  { key: "quantity", label: "Üretim Miktarı", required: true, synonyms: ["üretim", "üretim miktarı", "miktar", "output"] },
  { key: "unit", label: "Birim", required: false, synonyms: ["birim", "unit"] },
];

function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

export function autoMapColumns(headers: string[], fields: TargetField[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));

  for (const field of fields) {
    const candidates = [field.label, ...field.synonyms].map(normalize);
    const match = normalizedHeaders.find((h) => candidates.some((c) => h.norm === c || h.norm.includes(c)));
    result[field.key] = match?.raw ?? null;
  }
  return result;
}
