import type { ActivityData, Installation, Precursor, ProductionProcess, Product } from "@/lib/types";
import { calcInstallationCompleteness } from "@/lib/facilities/completeness";

export interface OverallCompletenessInput {
  installations: Installation[];
  processes: ProductionProcess[];
  products: Product[];
  activityData: ActivityData[];
  precursors: Precursor[];
}

export interface OverallCompletenessResult {
  overallPercent: number;
  installationsPercent: number;
  productsPercent: number;
  activityDataPercent: number;
  precursorsPercent: number;
}

export function calcOverallCompleteness(input: OverallCompletenessInput): OverallCompletenessResult {
  const { installations, processes, products, activityData, precursors } = input;

  const installationsPercent = installations.length
    ? Math.round(
        installations.reduce((sum, inst) => {
          const instProcesses = processes.filter((p) => p.installationId === inst.id);
          return sum + calcInstallationCompleteness(inst, instProcesses);
        }, 0) / installations.length
      )
    : 0;

  const productsPercent = products.length
    ? Math.round((products.filter((p) => p.inScope).length / products.length) * 100)
    : 0;

  const currentYear = new Date().getFullYear();
  const activeProcesses = processes.filter((p) => !p.isFinishingProcess);
  const activityDataPercent = activeProcesses.length
    ? Math.round(
        (activeProcesses.filter((proc) =>
          activityData.some((ad) => ad.processId === proc.id && ad.periodYear === currentYear)
        ).length /
          activeProcesses.length) *
          100
      )
    : 0;

  const precursorsPercent = precursors.length
    ? Math.round((precursors.filter((p) => p.sourceType !== "supplier_no_data").length / precursors.length) * 100)
    : 100;

  const overallPercent = Math.round(
    (installationsPercent + productsPercent + activityDataPercent + precursorsPercent) / 4
  );

  return { overallPercent, installationsPercent, productsPercent, activityDataPercent, precursorsPercent };
}

export interface MissingDataAction {
  label: string;
  href: string;
}

export function findMissingDataActions(input: OverallCompletenessInput): MissingDataAction[] {
  const { installations, processes, activityData, precursors } = input;
  const actions: MissingDataAction[] = [];
  const currentYear = new Date().getFullYear();

  for (const inst of installations) {
    const instProcesses = processes.filter((p) => p.installationId === inst.id && !p.isFinishingProcess);
    for (const proc of instProcesses) {
      const hasData = activityData.some((ad) => ad.processId === proc.id && ad.periodYear === currentYear);
      if (!hasData) {
        actions.push({
          label: `${inst.name} — ${proc.name}: ${currentYear} faaliyet verisi eksik`,
          href: "/dashboard/faaliyet-verisi",
        });
      }
    }
  }

  for (const prec of precursors) {
    if (prec.sourceType === "supplier_no_data") {
      actions.push({
        label: `Öncü ürün "${prec.name}": tedarikçi verisi eksik`,
        href: `/dashboard/urunler/${prec.productId}`,
      });
    }
  }

  return actions;
}
