import type {
  CarbonPriceRecord,
  DocumentRecord,
  EmissionCalculation,
  ImporterPackageSnapshot,
  Installation,
  Organization,
  PackageAnomalyExplanation,
  PackageCarbonPriceLine,
  PackageProductLine,
  PeriodExplanation,
  Precursor,
  Product,
} from "@/lib/types";

const DATA_QUALITY_SUMMARY_EN = "Based on producer-submitted facility activity data (measured, calculated, or estimated per line item; see attached activity data table).";
const CALCULATION_METHOD_EN =
  "Fuel combustion (net calorific value x emission factor) + process emissions + grid/PPA electricity + precursor embedded emissions, per tonne of output.";

export function buildPackageSnapshot(params: {
  organization: Organization;
  selectedProducts: Product[];
  installations: Installation[];
  precursorsByProduct: Record<string, Precursor[]>;
  calculationsByProcess: Record<string, EmissionCalculation | undefined>;
  carbonPricesByInstallation: Record<string, CarbonPriceRecord[]>;
  documents: DocumentRecord[];
  explanationsByProcess?: Record<string, PeriodExplanation | undefined>;
}): ImporterPackageSnapshot {
  const {
    organization,
    selectedProducts,
    installations,
    precursorsByProduct,
    calculationsByProcess,
    carbonPricesByInstallation,
    documents,
    explanationsByProcess = {},
  } = params;

  const involvedInstallationIds = new Set(selectedProducts.map((p) => p.installationId));
  const involvedInstallations = installations.filter((i) => involvedInstallationIds.has(i.id));

  const products: PackageProductLine[] = selectedProducts.map((product) => {
    const installation = installations.find((i) => i.id === product.installationId);
    const calc = calculationsByProcess[product.processId];
    const precursors = precursorsByProduct[product.id] ?? [];

    return {
      productId: product.id,
      name: product.name,
      cnCode: product.cnCode,
      cbamGoodsCategory: product.cbamGoodsCategory,
      installationName: installation?.name ?? "-",
      directEmissionsTco2PerTon: calc && calc.outputQuantityTon > 0 ? calc.directEmissionsTco2 / calc.outputQuantityTon : 0,
      indirectEmissionsTco2PerTon: calc && calc.outputQuantityTon > 0 ? calc.indirectEmissionsTco2 / calc.outputQuantityTon : 0,
      reportedScope: calc?.reportedScope ?? "direct_and_indirect",
      reportedSpecificEmissions: calc?.reportedSpecificEmissions ?? 0,
      calculationMethod: CALCULATION_METHOD_EN,
      dataQualityNote: DATA_QUALITY_SUMMARY_EN,
      precursorSources: precursors.map((p) => ({
        name: p.name,
        sourceType: p.sourceType,
        specificEmissionTco2PerTon: p.supplierEmissionValue ?? 0,
      })),
    };
  });

  const carbonPrices: PackageCarbonPriceLine[] = [];
  for (const installation of involvedInstallations) {
    const records = carbonPricesByInstallation[installation.id] ?? [];
    for (const r of records) {
      carbonPrices.push({
        installationName: installation.name,
        scheme: r.scheme,
        periodLabel: `${r.periodYear}${r.periodQuarter ? ` Q${r.periodQuarter}` : ""}`,
        amountPaid: r.amountPaid,
        currency: r.currency,
        tonnesCovered: r.tonnesCovered,
        effectivePricePerTon: r.effectivePricePerTon,
      });
    }
  }

  const documentLines: PackageDocumentLineLocal[] = documents.map((d) => ({
    fileName: d.fileName,
    relatedTo: d.docType ?? d.relatedCollection,
  }));

  const approvedExplanations: PackageAnomalyExplanation[] = selectedProducts
    .map((product) => {
      const explanation = explanationsByProcess[product.processId];
      if (!explanation?.approved) return null;
      return { productName: product.name, summaryTr: explanation.finalSummaryTr };
    })
    .filter((e): e is PackageAnomalyExplanation => e !== null);

  return {
    producerName: organization.name,
    producerTaxId: organization.taxId,
    producerContactEmail: organization.contactEmail,
    installations: involvedInstallations.map((i) => ({
      name: i.name,
      city: i.city,
      country: i.country,
      unLocode: i.unLocode,
    })),
    products,
    carbonPrices,
    documents: documentLines,
    approvedExplanations: approvedExplanations.length ? approvedExplanations : undefined,
    generatedAt: Date.now(),
  };
}

type PackageDocumentLineLocal = { fileName: string; relatedTo: string };

export function periodLabelFor(periodYear: number, periodQuarter?: number | null): string {
  return periodQuarter ? `${periodYear} Q${periodQuarter}` : `${periodYear} (Annual)`;
}
