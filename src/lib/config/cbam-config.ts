// Mevzuata bağlı, sık değişebilecek tüm sabitler bu dosyada toplanır.
// Kaynak: AB CBAM Tüzüğü (AB) 2023/956 ve uygulama tüzükleri. Değerler
// güncellendiğinde yalnızca bu dosyanın değişmesi yeterlidir.

export const CBAM_CRITICAL_DATES = {
  definitivePeriodStart: "2026-01-01",
  certificateSalesStart: "2027-02-01",
  firstAnnualDeclaration: "2027-09-30",
} as const;

// Gösterge niteliğinde güncel AB ETS / CBAM sertifika fiyat varsayımı (€/tCO2e).
// Elle güncellenebilir tek nokta.
export const CBAM_CERTIFICATE_PRICE_EUR = 75;

export const CBAM_CERTIFICATE_PRICE_SCENARIOS = {
  dusuk: 60,
  orta: 80,
  yuksek: 110,
} as const;

// Varsayılan değer (default value) yıllık artırım kademeleri.
// Gerçek veri sunulamadığında AB varsayılan değerleri bu oranda artırılarak uygulanır.
export const DEFAULT_VALUE_MARKUP_BY_YEAR: Record<number, number> = {
  2026: 0.10,
  2027: 0.20,
  2028: 0.30,
  2029: 0.30,
  2030: 0.30,
  2031: 0.30,
  2032: 0.30,
  2033: 0.30,
  2034: 0.30,
};

export function getDefaultValueMarkup(year: number): number {
  if (year in DEFAULT_VALUE_MARKUP_BY_YEAR) return DEFAULT_VALUE_MARKUP_BY_YEAR[year];
  return year < 2026 ? 0 : 0.30;
}

// Serbest tahsisatın kademeli azalması nedeniyle sertifika ibrazına tabi
// emisyon payı (CBAM factor). 1 - bu oran kadarı hâlâ serbest tahsisatla karşılanır.
// Kaynak: Tüzük (AB) 2023/956, Ek genel çerçevesi (gösterge niteliğinde, resmi
// yıllık yayımlarla teyit edilmelidir).
export const CBAM_CERTIFICATE_OBLIGATION_SHARE_BY_YEAR: Record<number, number> = {
  2026: 0.025,
  2027: 0.05,
  2028: 0.10,
  2029: 0.225,
  2030: 0.485,
  2031: 0.61,
  2032: 0.735,
  2033: 0.86,
  2034: 1.0,
};

export function getCertificateObligationShare(year: number): number {
  if (year in CBAM_CERTIFICATE_OBLIGATION_SHARE_BY_YEAR) {
    return CBAM_CERTIFICATE_OBLIGATION_SHARE_BY_YEAR[year];
  }
  return year >= 2034 ? 1.0 : 0;
}

export const SIMULATION_YEAR_RANGE = { start: 2026, end: 2034 };

// Sektörlerin ithalatçıya raporladığı emisyon kapsamı: yalnızca doğrudan mı,
// yoksa doğrudan + dolaylı mı. Motor her zaman ikisini de hesaplar/saklar.
export const SECTOR_REPORTED_SCOPE: Record<string, "direct_only" | "direct_and_indirect"> = {
  demir_celik: "direct_only",
  aluminyum: "direct_only",
  hidrojen: "direct_only",
  cimento: "direct_and_indirect",
  gubre: "direct_and_indirect",
};

// Sektörel gösterge emisyon yoğunluğu bantları (tCO2e / ton ürün).
// Yalnızca ücretsiz hesaplayıcıda kaba maruziyet tahmini üretmek için kullanılır;
// gerçek hesaplama motoru (P9) tesis bazlı gerçek verilere dayanır.
export const SECTOR_INTENSITY_BANDS: Record<
  string,
  { label: string; min: number; max: number; typical: number }
> = {
  demir_celik: { label: "Demir-Çelik", min: 0.4, max: 2.2, typical: 1.3 },
  aluminyum: { label: "Alüminyum", min: 1.5, max: 16.5, typical: 6.5 },
  cimento: { label: "Çimento", min: 0.5, max: 0.9, typical: 0.7 },
  gubre: { label: "Gübre", min: 1.0, max: 3.5, typical: 2.1 },
  hidrojen: { label: "Hidrojen", min: 2.0, max: 10.0, typical: 5.0 },
};

export const SECTOR_LABELS: Record<string, string> = {
  demir_celik: "Demir-Çelik",
  aluminyum: "Alüminyum",
  cimento: "Çimento",
  gubre: "Gübre",
  hidrojen: "Hidrojen",
};
