// Emisyon faktörleri kütüphanesi. Her faktörün kaynağı ve geçerlilik yılı
// kayıtlıdır. Bu değerler IPCC 2006 Kılavuzu varsayılan değerlerine ve kamuya
// açık ulusal yayınlara dayanan GÖSTERGE niteliğindedir; resmi CBAM beyanı
// öncesi doğrulanmış / tesise özgü faktörlerle değiştirilmelidir.

import type { FuelType } from "@/lib/types";

export interface FuelFactor {
  label: string;
  unit: string;
  netCalorificValueGjPerUnit: number; // GJ / birim
  emissionFactorKgCo2PerGj: number; // kg CO2 / GJ
  source: string;
  validFromYear: number;
}

export const FUEL_FACTORS: Record<FuelType, FuelFactor> = {
  dogalgaz: {
    label: "Doğalgaz",
    unit: "Nm³",
    netCalorificValueGjPerUnit: 0.0349,
    emissionFactorKgCo2PerGj: 56.1,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  tas_komuru: {
    label: "Taş kömürü",
    unit: "ton",
    netCalorificValueGjPerUnit: 25.8,
    emissionFactorKgCo2PerGj: 94.6,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  linyit: {
    label: "Linyit",
    unit: "ton",
    netCalorificValueGjPerUnit: 11.9,
    emissionFactorKgCo2PerGj: 101.0,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  kok_komuru: {
    label: "Kok kömürü",
    unit: "ton",
    netCalorificValueGjPerUnit: 28.2,
    emissionFactorKgCo2PerGj: 107.0,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  fuel_oil: {
    label: "Fuel oil",
    unit: "ton",
    netCalorificValueGjPerUnit: 40.4,
    emissionFactorKgCo2PerGj: 77.4,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  lpg: {
    label: "LPG",
    unit: "ton",
    netCalorificValueGjPerUnit: 47.3,
    emissionFactorKgCo2PerGj: 63.1,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  motorin: {
    label: "Motorin",
    unit: "ton",
    netCalorificValueGjPerUnit: 43.0,
    emissionFactorKgCo2PerGj: 74.1,
    source: "IPCC 2006 Guidelines, Vol.2 Ch.1 (varsayılan)",
    validFromYear: 2024,
  },
  diger: {
    label: "Diğer / manuel giriş",
    unit: "ton",
    netCalorificValueGjPerUnit: 0,
    emissionFactorKgCo2PerGj: 0,
    source: "Kullanıcı tarafından manuel girilmeli",
    validFromYear: 2024,
  },
};

export const TURKEY_GRID_EMISSION_FACTOR = {
  valueTco2PerMwh: 0.442,
  source: "T.C. Enerji ve Tabii Kaynaklar Bakanlığı, ulusal şebeke ortalaması (gösterge niteliğinde)",
  validFromYear: 2024,
};

// Yakma dışı, doğrudan proses kaynaklı emisyon faktörleri (kalsinasyon vb.)
export interface ProcessEmissionFactor {
  label: string;
  valueTco2PerTonOutput: number;
  source: string;
  validFromYear: number;
}

export const PROCESS_EMISSION_FACTORS: Record<string, ProcessEmissionFactor> = {
  cimento_klinker_kalsinasyon: {
    label: "Klinker kalsinasyon proses emisyonu",
    valueTco2PerTonOutput: 0.525,
    source: "IPCC 2006 Guidelines, Vol.3 Ch.2, varsayılan klinker faktörü",
    validFromYear: 2024,
  },
  gubre_amonyak_reforming: {
    label: "Amonyak (doğalgaz buhar reformasyonu) proses emisyonu",
    valueTco2PerTonOutput: 1.65,
    source: "IPCC 2006 Guidelines, Vol.3 Ch.3, varsayılan NH3 faktörü",
    validFromYear: 2024,
  },
  gubre_nitrik_asit_n2o: {
    label: "Nitrik asit üretimi N2O proses emisyonu (CO2e)",
    valueTco2PerTonOutput: 0.3,
    source: "IPCC 2006 Guidelines, Vol.3 Ch.3, varsayılan N2O faktörü (GWP100 ile CO2e)",
    validFromYear: 2024,
  },
};
