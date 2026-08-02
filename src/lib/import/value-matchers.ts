import { FUEL_FACTORS } from "@/lib/config/emission-factors";
import type { DataQuality, ElectricitySourceType, FuelType } from "@/lib/types";

function norm(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

export function matchFuelType(label: string): FuelType | null {
  const n = norm(label);
  const entry = (Object.entries(FUEL_FACTORS) as [FuelType, (typeof FUEL_FACTORS)[FuelType]][]).find(
    ([key, factor]) => norm(factor.label) === n || norm(key) === n
  );
  return entry?.[0] ?? null;
}

export function matchSourceType(label: string): ElectricitySourceType {
  const n = norm(label);
  if (n.includes("ppa") || n.includes("yenilenebilir")) return "yenilenebilir_ppa";
  if (n.includes("tesisici") || n.includes("kendi")) return "tesis_ici_uretim";
  return "sebeke";
}

export function matchDataQuality(label: string | undefined): DataQuality {
  const n = norm(label ?? "");
  if (n.includes("olcul") || n.includes("fatura") || n.includes("sayac")) return "olculmus";
  if (n.includes("hesap")) return "hesaplanmis";
  return "tahmin";
}
