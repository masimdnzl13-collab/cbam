// Plan fiyatları ve limitleri — tek güncelleme noktası. Fiyat değişikliği
// yalnızca bu dosyada yapılır.

import type { SubscriptionPlan } from "@/lib/types";

export interface PlanLimits {
  maxInstallations: number | "unlimited";
  maxUsers: number | "unlimited";
  maxProductsPerPeriod: number | "unlimited";
  maxPackagesPerPeriod: number | "unlimited";
  packageWatermarked: boolean;
  verifierPackageIncluded: boolean;
  multiOrgManagement: boolean;
  prioritySupport: boolean;
}

export interface PlanConfig {
  id: SubscriptionPlan;
  label: string;
  monthlyPriceEur: number | null; // null => "iletişime geç"
  yearlyPriceEur: number | null; // iki ay indirimli (10 ay bedeli)
  limits: PlanLimits;
  featureBullets: string[];
}

export const PLAN_CONFIG: Record<Exclude<SubscriptionPlan, "deneme">, PlanConfig> = {
  baslangic: {
    id: "baslangic",
    label: "Başlangıç",
    monthlyPriceEur: 49,
    yearlyPriceEur: 49 * 10,
    limits: {
      maxInstallations: 1,
      maxUsers: 1,
      maxProductsPerPeriod: 5,
      maxPackagesPerPeriod: 3,
      packageWatermarked: true,
      verifierPackageIncluded: false,
      multiOrgManagement: false,
      prioritySupport: false,
    },
    featureBullets: [
      "1 tesis, 1 kullanıcı",
      "Dönem başına en fazla 5 ürün",
      "Filigranlı veri paketi çıktısı",
    ],
  },
  profesyonel: {
    id: "profesyonel",
    label: "Profesyonel",
    monthlyPriceEur: 199,
    yearlyPriceEur: 199 * 10,
    limits: {
      maxInstallations: 3,
      maxUsers: 5,
      maxProductsPerPeriod: "unlimited",
      maxPackagesPerPeriod: "unlimited",
      packageWatermarked: false,
      verifierPackageIncluded: true,
      multiOrgManagement: false,
      prioritySupport: false,
    },
    featureBullets: [
      "3 tesis, 5 kullanıcı",
      "Sınırsız ürün ve veri paketi",
      "Doğrulayıcı hazırlık paketi dahil",
      "Filigransız çıktı",
    ],
  },
  kurumsal: {
    id: "kurumsal",
    label: "Kurumsal",
    monthlyPriceEur: null,
    yearlyPriceEur: null,
    limits: {
      maxInstallations: "unlimited",
      maxUsers: "unlimited",
      maxProductsPerPeriod: "unlimited",
      maxPackagesPerPeriod: "unlimited",
      packageWatermarked: false,
      verifierPackageIncluded: true,
      multiOrgManagement: true,
      prioritySupport: true,
    },
    featureBullets: [
      "Sınırsız tesis ve kullanıcı",
      "Çoklu organizasyon yönetimi",
      "Öncelikli destek",
      "Özel fiyatlandırma",
    ],
  },
};

export const TRIAL_DAYS = 14;
export const DUNNING_GRACE_DAYS = 7;
