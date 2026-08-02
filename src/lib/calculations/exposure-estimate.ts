// Ücretsiz maruziyet hesaplayıcısının (P4) istemci tarafı hesap mantığı.
// Bu sektör bandı bazlı KABA bir tahmindir; gerçek hesaplama motoru (P9)
// tesis bazlı gerçek verilere dayanır ve çok daha isabetlidir.

import type { CbamGoodsCategory, Sector } from "@/lib/types";
import {
  CBAM_CERTIFICATE_PRICE_EUR,
  SECTOR_INTENSITY_BANDS,
  getCertificateObligationShare,
  getDefaultValueMarkup,
  SIMULATION_YEAR_RANGE,
} from "@/lib/config/cbam-config";
import { getDefaultValue } from "@/lib/config/default-values";

export interface ExposureEstimateInput {
  sector: Sector;
  category: CbamGoodsCategory;
  annualExportTon: number;
  targetYear?: number;
}

export interface ExposureEstimateResult {
  sectorLabel: string;
  typicalIntensity: number;
  estimatedAnnualEmissionTon: number;
  certificatePriceEur: number;
  estimatedImporterCostEur: number;
  realDataScenario: {
    intensity: number;
    costEur: number;
  };
  defaultValueScenario: {
    intensity: number;
    markupPercent: number;
    costEur: number;
  };
  costDifferenceEur: number;
}

export function estimateExposure({
  sector,
  category,
  annualExportTon,
  targetYear = 2027,
}: ExposureEstimateInput): ExposureEstimateResult {
  const band = SECTOR_INTENSITY_BANDS[sector];
  const typicalIntensity = band?.typical ?? 1;
  const estimatedAnnualEmissionTon = typicalIntensity * annualExportTon;

  const obligationShare = getCertificateObligationShare(targetYear);
  const estimatedImporterCostEur =
    estimatedAnnualEmissionTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;

  const defaultEntry = getDefaultValue(category);
  const markup = getDefaultValueMarkup(targetYear);
  const defaultIntensity = defaultEntry
    ? (defaultEntry.directTco2PerTon + defaultEntry.indirectTco2PerTon) * (1 + markup)
    : typicalIntensity * (1 + markup);

  const realCost =
    typicalIntensity * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
  const defaultCost =
    defaultIntensity * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;

  return {
    sectorLabel: band?.label ?? sector,
    typicalIntensity,
    estimatedAnnualEmissionTon,
    certificatePriceEur: CBAM_CERTIFICATE_PRICE_EUR,
    estimatedImporterCostEur,
    realDataScenario: { intensity: typicalIntensity, costEur: realCost },
    defaultValueScenario: { intensity: defaultIntensity, markupPercent: markup * 100, costEur: defaultCost },
    costDifferenceEur: defaultCost - realCost,
  };
}

export interface YearlyCostPoint {
  year: number;
  realDataCostEur: number;
  defaultValueCostEur: number;
}

export function projectMultiYearCost(
  sector: Sector,
  category: CbamGoodsCategory,
  annualExportTon: number
): YearlyCostPoint[] {
  const band = SECTOR_INTENSITY_BANDS[sector];
  const typicalIntensity = band?.typical ?? 1;
  const defaultEntry = getDefaultValue(category);
  const baseDefaultIntensity = defaultEntry
    ? defaultEntry.directTco2PerTon + defaultEntry.indirectTco2PerTon
    : typicalIntensity;

  const points: YearlyCostPoint[] = [];
  for (let year = SIMULATION_YEAR_RANGE.start; year <= SIMULATION_YEAR_RANGE.end; year++) {
    const obligationShare = getCertificateObligationShare(year);
    const markup = getDefaultValueMarkup(year);
    const realDataCostEur =
      typicalIntensity * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
    const defaultValueCostEur =
      baseDefaultIntensity * (1 + markup) * annualExportTon * obligationShare * CBAM_CERTIFICATE_PRICE_EUR;
    points.push({ year, realDataCostEur, defaultValueCostEur });
  }
  return points;
}
