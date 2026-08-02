// P8 revizyonu: birim uyuşmazlığı tespiti ve dönüştürme önerisi (ton/kg, kWh/MWh vb.).

export interface UnitConversionSuggestion {
  needsConversion: boolean;
  factor: number;
  message?: string;
}

const CONVERSIONS: Record<string, Record<string, number>> = {
  kwh: { mwh: 1000, kwh: 1 },
  mwh: { kwh: 0.001, mwh: 1 },
  ton: { kg: 0.001, ton: 1, tonne: 1 },
  kg: { ton: 1000, kg: 1 },
};

function normalizeUnit(u: string): string {
  return u.trim().toLocaleLowerCase("tr-TR").replace(/\./g, "");
}

export function suggestUnitConversion(foundUnit: string, expectedUnit: string): UnitConversionSuggestion {
  const found = normalizeUnit(foundUnit);
  const expected = normalizeUnit(expectedUnit);

  if (found === expected) return { needsConversion: false, factor: 1 };

  const table = CONVERSIONS[expected];
  if (table && found in table) {
    return {
      needsConversion: true,
      factor: table[found],
      message: `Dosyada "${foundUnit}" birimi bulundu, sistem "${expectedUnit}" bekliyor. Değer ${table[found]} ile çarpılarak dönüştürülecek.`,
    };
  }

  return {
    needsConversion: true,
    factor: 1,
    message: `Dosyada "${foundUnit}" birimi bulundu ama sistem "${expectedUnit}" bekliyor. Otomatik dönüştürme önerisi yok — lütfen kontrol edin.`,
  };
}
