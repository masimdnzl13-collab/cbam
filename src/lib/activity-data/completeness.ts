import type { ActivityData } from "@/lib/types";

export function calcActivityDataCompleteness(
  data: Pick<ActivityData, "fuels" | "electricity" | "inputMaterials" | "outputQuantityTon">
): number {
  let score = 0;
  if (data.fuels.length > 0) score += 1;
  if (data.electricity && data.electricity.totalConsumptionKwh > 0) score += 1;
  if (data.inputMaterials.length > 0) score += 1;
  if (data.outputQuantityTon > 0) score += 1;
  return Math.round((score / 4) * 100);
}
