// Emisyon hesaplama motoru (P9). Tesis-dönem faaliyet verisinden ürün başına
// spesifik gömülü emisyona (SEE) kadar tüm zinciri hesaplar. Bkz. CLAUDE.md
// "Sektörel iş kuralları" — motor her zaman hem doğrudan hem dolaylı emisyonu
// hesaplar/saklar, sektöre göre yalnızca biri ithalatçıya raporlanır.

import type { ActivityData, Precursor, ProductionProcess, Sector } from "@/lib/types";
import { FUEL_FACTORS, PROCESS_EMISSION_FACTORS, TURKEY_GRID_EMISSION_FACTOR } from "@/lib/config/emission-factors";
import { SECTOR_REPORTED_SCOPE } from "@/lib/config/cbam-config";
import { getDefaultValue } from "@/lib/config/default-values";
import type { CbamGoodsCategory } from "@/lib/types";

export interface PrecursorResolutionContext {
  // own_process kaynaklı öncüller için, o prosesin en güncel hesaplamasından
  // gelen ton başına toplam gömülü emisyon (tCO2e/ton). Çağıran taraf
  // (UI), ilgili emission_calculations kaydını önceden çekip burada sağlar.
  ownProcessSpecificEmissions: Record<string, number>;
  // Tedarikçi verisi olmayan öncüller için varsayılan değer kaynağı olarak
  // kullanılacak CBAM emtia kategorisi (genelde nihai ürünün kategorisi).
  fallbackCategory: CbamGoodsCategory;
}

export interface FuelEmissionLine {
  fuelType: string;
  quantity: number;
  tco2: number;
}

export interface PrecursorContribution {
  precursorId: string;
  name: string;
  sourceType: Precursor["sourceType"];
  specificEmissionTco2PerTon: number;
  quantityPerOutputTon: number;
  contributionTco2: number;
  usedDefaultValue: boolean;
}

export interface EmissionCalculationOutput {
  fuelEmissions: FuelEmissionLine[];
  fuelEmissionsTotalTco2: number;
  processEmissionTco2: number;
  directEmissionsTco2: number;
  indirectEmissionsTco2: number;
  precursorEmissionsTco2: number;
  precursorContributions: PrecursorContribution[];
  totalEmbeddedEmissionsTco2: number;
  outputQuantityTon: number;
  specificEmbeddedEmissions: number;
  reportedScope: "direct_only" | "direct_and_indirect";
  reportedSpecificEmissions: number;
}

function calcFuelEmissions(activityData: ActivityData): { lines: FuelEmissionLine[]; total: number } {
  const lines = activityData.fuels.map((f) => {
    const factor = FUEL_FACTORS[f.fuelType];
    const gj = f.quantity * factor.netCalorificValueGjPerUnit;
    const tco2 = (gj * factor.emissionFactorKgCo2PerGj) / 1000;
    return { fuelType: f.fuelType, quantity: f.quantity, tco2 };
  });
  return { lines, total: lines.reduce((sum, l) => sum + l.tco2, 0) };
}

function calcProcessEmission(process: ProductionProcess, outputQuantityTon: number): number {
  if (!process.templateKey) return 0;
  const factor = PROCESS_EMISSION_FACTORS[process.templateKey];
  if (!factor) return 0;
  return factor.valueTco2PerTonOutput * outputQuantityTon;
}

function calcIndirectEmissions(activityData: ActivityData): number {
  const electricity = activityData.electricity;
  if (!electricity) return 0;
  if (electricity.sourceType === "yenilenebilir_ppa" && electricity.ppaDocumentId) return 0;
  const mwh = electricity.totalConsumptionKwh / 1000;
  return mwh * TURKEY_GRID_EMISSION_FACTOR.valueTco2PerMwh;
}

function resolvePrecursorSpecificEmission(
  precursor: Precursor,
  context: PrecursorResolutionContext
): { value: number; usedDefaultValue: boolean } {
  if (precursor.sourceType === "own_process" && precursor.ownProcessId) {
    return {
      value: context.ownProcessSpecificEmissions[precursor.ownProcessId] ?? 0,
      usedDefaultValue: false,
    };
  }
  if (precursor.sourceType === "supplier_with_data") {
    return { value: precursor.supplierEmissionValue ?? 0, usedDefaultValue: false };
  }
  // supplier_no_data: AB varsayılan değeri (kategori düzeyinde temsili)
  const fallback = getDefaultValue(context.fallbackCategory);
  const value = fallback ? fallback.directTco2PerTon + fallback.indirectTco2PerTon : 0;
  return { value, usedDefaultValue: true };
}

function calcPrecursorEmissions(
  precursors: Precursor[],
  outputQuantityTon: number,
  context: PrecursorResolutionContext
): { contributions: PrecursorContribution[]; total: number } {
  const contributions = precursors.map((p) => {
    const { value, usedDefaultValue } = resolvePrecursorSpecificEmission(p, context);
    const contributionTco2 = value * p.quantityPerOutputTon * outputQuantityTon;
    return {
      precursorId: p.id,
      name: p.name,
      sourceType: p.sourceType,
      specificEmissionTco2PerTon: value,
      quantityPerOutputTon: p.quantityPerOutputTon,
      contributionTco2,
      usedDefaultValue,
    };
  });
  return { contributions, total: contributions.reduce((sum, c) => sum + c.contributionTco2, 0) };
}

export function calculateEmissions(
  activityData: ActivityData,
  process: ProductionProcess,
  precursors: Precursor[],
  sector: Sector,
  context: PrecursorResolutionContext
): EmissionCalculationOutput {
  const outputQuantityTon = activityData.outputQuantityTon || 0;

  const { lines: fuelEmissions, total: fuelEmissionsTotalTco2 } = calcFuelEmissions(activityData);
  const processEmissionTco2 = calcProcessEmission(process, outputQuantityTon);
  const directEmissionsTco2 = fuelEmissionsTotalTco2 + processEmissionTco2;
  const indirectEmissionsTco2 = calcIndirectEmissions(activityData);
  const { contributions: precursorContributions, total: precursorEmissionsTco2 } = calcPrecursorEmissions(
    precursors,
    outputQuantityTon,
    context
  );

  const totalEmbeddedEmissionsTco2 = directEmissionsTco2 + indirectEmissionsTco2 + precursorEmissionsTco2;
  const specificEmbeddedEmissions = outputQuantityTon > 0 ? totalEmbeddedEmissionsTco2 / outputQuantityTon : 0;

  const reportedScope = SECTOR_REPORTED_SCOPE[sector] ?? "direct_and_indirect";
  // CBAM metodolojisi: öncü ürünlerin gömülü emisyonu, raporlama kapsamı ne
  // olursa olsun nihai ürünün "doğrudan" emisyonuna dahil edilir.
  const reportedTotal =
    reportedScope === "direct_only"
      ? directEmissionsTco2 + precursorEmissionsTco2
      : totalEmbeddedEmissionsTco2;
  const reportedSpecificEmissions = outputQuantityTon > 0 ? reportedTotal / outputQuantityTon : 0;

  return {
    fuelEmissions,
    fuelEmissionsTotalTco2,
    processEmissionTco2,
    directEmissionsTco2,
    indirectEmissionsTco2,
    precursorEmissionsTco2,
    precursorContributions,
    totalEmbeddedEmissionsTco2,
    outputQuantityTon,
    specificEmbeddedEmissions,
    reportedScope,
    reportedSpecificEmissions,
  };
}
