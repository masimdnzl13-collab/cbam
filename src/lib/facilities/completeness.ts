import type { Installation, ProductionProcess } from "@/lib/types";

export function calcInstallationCompleteness(
  installation: Installation,
  processes: ProductionProcess[]
): number {
  let score = 0;
  const total = 3;

  if (installation.productionRouteType !== "diger") score += 1;
  if (installation.address && installation.lat != null && installation.lng != null && installation.unLocode) {
    score += 1;
  }
  if (processes.some((p) => !p.isFinishingProcess)) score += 1;

  return Math.round((score / total) * 100);
}
