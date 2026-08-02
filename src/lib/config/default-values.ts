// AB CBAM varsayılan değerleri (default values), ürün kategorisi düzeyinde.
// Kaynak: Komisyon Uygulama Tüzüğü (AB) 2023/1773, Ek IV ve sonraki
// güncellemeler. Gerçek tüzük ürün/proses rotası bazında çok daha ayrıntılı
// bir tablo yayımlar; burada CBAM emtia kategorisi düzeyinde TEMSİLİ bir
// özet tutulur ve elle güncellenir. `getDefaultValueMarkup` ile birlikte
// kullanılmalıdır (bkz. cbam-config.ts).

import type { CbamGoodsCategory } from "@/lib/types";

export interface DefaultValueEntry {
  label: string;
  directTco2PerTon: number;
  indirectTco2PerTon: number;
  source: string;
  validFromYear: number;
}

export const DEFAULT_VALUES: Partial<Record<CbamGoodsCategory, DefaultValueEntry>> = {
  demir_celik: {
    label: "Demir-Çelik (AB kategori ortalaması)",
    directTco2PerTon: 1.9,
    indirectTco2PerTon: 0.35,
    source: "Uygulama Tüzüğü (AB) 2023/1773, Ek IV (temsili kategori özeti)",
    validFromYear: 2026,
  },
  aluminyum: {
    label: "Alüminyum (AB kategori ortalaması)",
    directTco2PerTon: 1.5,
    indirectTco2PerTon: 8.6,
    source: "Uygulama Tüzüğü (AB) 2023/1773, Ek IV (temsili kategori özeti)",
    validFromYear: 2026,
  },
  cimento: {
    label: "Çimento (AB kategori ortalaması)",
    directTco2PerTon: 0.66,
    indirectTco2PerTon: 0.08,
    source: "Uygulama Tüzüğü (AB) 2023/1773, Ek IV (temsili kategori özeti)",
    validFromYear: 2026,
  },
  gubre: {
    label: "Gübre (AB kategori ortalaması)",
    directTco2PerTon: 2.4,
    indirectTco2PerTon: 0.2,
    source: "Uygulama Tüzüğü (AB) 2023/1773, Ek IV (temsili kategori özeti)",
    validFromYear: 2026,
  },
  hidrojen: {
    label: "Hidrojen (AB kategori ortalaması)",
    directTco2PerTon: 9.0,
    indirectTco2PerTon: 1.0,
    source: "Uygulama Tüzüğü (AB) 2023/1773, Ek IV (temsili kategori özeti)",
    validFromYear: 2026,
  },
};

export function getDefaultValue(category: CbamGoodsCategory): DefaultValueEntry | undefined {
  return DEFAULT_VALUES[category];
}
