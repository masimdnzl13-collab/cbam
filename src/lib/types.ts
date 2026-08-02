// Kanonik Firestore veri modeli tipleri. Koleksiyon adları sabittir, aşağıdaki
// `COLLECTIONS` nesnesinden referans alınmalıdır (typo'ları önlemek için).

export const COLLECTIONS = {
  organizations: "organizations",
  users: "users",
  installations: "installations",
  productionProcesses: "production_processes",
  products: "products",
  precursors: "precursors",
  activityData: "activity_data",
  emissionCalculations: "emission_calculations",
  carbonPrices: "carbon_prices",
  importerPackages: "importer_packages",
  documents: "documents",
  auditLog: "audit_log",
  waitlist: "waitlist",
  calculatorLeads: "calculator_leads",
  importerRequests: "importer_requests",
  errorLogs: "error_logs",
  supplierRequests: "supplier_requests",
  periodExplanations: "period_explanations",
  documentChecks: "document_checks",
} as const;

export type Sector = "demir_celik" | "aluminyum" | "cimento" | "gubre" | "hidrojen";

export type UserRole = "owner" | "editor" | "viewer";

export type SubscriptionPlan = "deneme" | "baslangic" | "profesyonel" | "kurumsal";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type BillingInterval = "monthly" | "yearly";

export interface Organization {
  id: string;
  name: string;
  sector: Sector;
  taxId?: string;
  city?: string;
  contactEmail: string;
  contactPhone?: string;
  exportedCategories?: CbamGoodsCategory[];
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  billingInterval?: BillingInterval;
  trialEndsAt?: number;
  pastDueSince?: number;
  lastWeeklyCompletenessPercent?: number;
  welcomeSeriesStep?: number; // 0-3, hoş geldin e-posta serisinde kaçıncı adımın gönderildiği
  providerSubscriptionId?: string;
  onboardingCompleted: boolean;
  onboardingChecklist?: {
    installationDetailsCompleted: boolean;
    firstActivityDataEntered: boolean;
    productsMapped: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  organizationId: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: number;
}

export type ProductionRouteType =
  | "eaf" // elektrik ark ocağı
  | "bf_bof" // yüksek fırın - bazik oksijen konvertörü
  | "aluminyum_birincil"
  | "aluminyum_ikincil"
  | "cimento_entegre"
  | "cimento_ogutme"
  | "gubre_amonyak"
  | "gubre_nitrik_asit"
  | "gubre_ure"
  | "hidrojen_smr"
  | "hidrojen_elektroliz"
  | "diger";

export interface Installation {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  unLocode?: string;
  productionRouteType: ProductionRouteType;
  createdAt: number;
  updatedAt: number;
}

export interface ProductionProcess {
  id: string;
  organizationId: string;
  installationId: string;
  name: string;
  templateKey?: string;
  sector: Sector;
  systemBoundaryDescription: string;
  isFinishingProcess: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CbamGoodsCategory =
  | "demir_celik"
  | "aluminyum"
  | "cimento"
  | "gubre"
  | "hidrojen"
  | "elektrik"
  | "kapsam_disi";

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  cnCode: string;
  cbamGoodsCategory: CbamGoodsCategory;
  inScope: boolean;
  installationId: string;
  processId: string;
  annualProductionTon?: number;
  annualEuExportTon?: number;
  createdAt: number;
  updatedAt: number;
}

export type PrecursorSourceType = "own_process" | "supplier_with_data" | "supplier_no_data";

export interface Precursor {
  id: string;
  organizationId: string;
  productId: string;
  name: string;
  sourceType: PrecursorSourceType;
  // Nihai ürünün 1 tonu başına tüketilen öncü ürün miktarı (ton öncü / ton ürün).
  quantityPerOutputTon: number;
  ownProcessId?: string;
  supplierName?: string;
  supplierEmissionValue?: number; // tCO2e/ton
  supplierDocumentId?: string;
  defaultValueUsed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type FuelType =
  | "dogalgaz"
  | "tas_komuru"
  | "linyit"
  | "kok_komuru"
  | "fuel_oil"
  | "lpg"
  | "motorin"
  | "diger";

export type DataQuality = "olculmus" | "hesaplanmis" | "tahmin";

export type ImportSource = "manual" | "excel" | "csv" | "pdf";

export interface FuelEntry {
  fuelType: FuelType;
  quantity: number;
  unit: string;
  dataQuality: DataQuality;
  documentId?: string;
  importSource?: ImportSource;
}

export type ElectricitySourceType = "sebeke" | "tesis_ici_uretim" | "yenilenebilir_ppa";

export interface ElectricityEntry {
  totalConsumptionKwh: number;
  sourceType: ElectricitySourceType;
  ppaDocumentId?: string;
  dataQuality: DataQuality;
  importSource?: ImportSource;
}

export interface InputMaterialEntry {
  materialName: string;
  quantity: number;
  unit: string;
  dataQuality: DataQuality;
  documentId?: string;
  importSource?: ImportSource;
}

export interface ActivityData {
  id: string;
  organizationId: string;
  installationId: string;
  processId: string;
  periodYear: number;
  periodQuarter?: 1 | 2 | 3 | 4;
  fuels: FuelEntry[];
  electricity?: ElectricityEntry;
  inputMaterials: InputMaterialEntry[];
  outputQuantityTon: number;
  isDraft: boolean;
  isLocked: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface EmissionCalculation {
  id: string;
  organizationId: string;
  installationId: string;
  processId: string;
  productId?: string;
  activityDataId: string;
  periodYear: number;
  periodQuarter?: 1 | 2 | 3 | 4;
  version: number;
  directEmissionsTco2: number;
  indirectEmissionsTco2: number;
  precursorEmissionsTco2: number;
  totalEmbeddedEmissionsTco2: number;
  outputQuantityTon: number;
  specificEmbeddedEmissions: number; // tCO2e / ton (doğrudan+dolaylı+öncü, tam toplam)
  reportedSpecificEmissions: number; // tCO2e / ton (sektöre göre raporlanan kapsam)
  reportedScope: "direct_only" | "direct_and_indirect";
  inputsSnapshot: Record<string, unknown>;
  factorsSnapshot: Record<string, unknown>;
  calculatedAt: number;
}

export interface CarbonPriceRecord {
  id: string;
  organizationId: string;
  installationId: string;
  scheme: string; // ör. "TR ETS Pilot Dönemi"
  periodYear: number;
  periodQuarter?: 1 | 2 | 3 | 4;
  amountPaid: number;
  currency: string; // ör. "TRY", "EUR", "USD"
  tonnesCovered: number;
  effectivePricePerTon: number; // amountPaid / tonnesCovered, otomatik hesaplanır
  hasAllocationOrRefund: boolean;
  allocationNote?: string;
  documentId?: string;
  createdAt: number;
}

export type ImporterPackageStatus = "taslak" | "gonderildi" | "goruntulendi" | "onaylandi";

export interface PackageProductLine {
  productId: string;
  name: string;
  cnCode: string;
  cbamGoodsCategory: CbamGoodsCategory;
  installationName: string;
  directEmissionsTco2PerTon: number;
  indirectEmissionsTco2PerTon: number;
  reportedScope: "direct_only" | "direct_and_indirect";
  reportedSpecificEmissions: number;
  calculationMethod: string;
  dataQualityNote: string;
  precursorSources: {
    name: string;
    sourceType: PrecursorSourceType;
    specificEmissionTco2PerTon: number;
  }[];
}

export interface PackageCarbonPriceLine {
  installationName: string;
  scheme: string;
  periodLabel: string;
  amountPaid: number;
  currency: string;
  tonnesCovered: number;
  effectivePricePerTon: number;
}

export interface PackageDocumentLine {
  fileName: string;
  relatedTo: string;
}

export interface PackageAnomalyExplanation {
  productName: string;
  summaryTr: string;
}

export interface ImporterPackageSnapshot {
  producerName: string;
  producerTaxId?: string;
  producerContactEmail: string;
  installations: { name: string; city: string; country: string; unLocode?: string }[];
  products: PackageProductLine[];
  carbonPrices: PackageCarbonPriceLine[];
  documents: PackageDocumentLine[];
  approvedExplanations?: PackageAnomalyExplanation[];
  generatedAt: number;
}

export interface ImporterPackage {
  id: string;
  organizationId: string;
  productIds: string[];
  periodYear: number;
  periodQuarter?: 1 | 2 | 3 | 4;
  buyerName: string;
  buyerCountry: string;
  buyerContact: string;
  shareToken: string;
  status: ImporterPackageStatus;
  version: number;
  watermarked: boolean;
  dataSnapshot: ImporterPackageSnapshot;
  viewCount: number;
  lastViewedAt?: number;
  acknowledgedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentRecord {
  id: string;
  organizationId: string;
  storagePath: string;
  fileName: string;
  relatedCollection: string;
  relatedId: string;
  uploadedBy: string;
  installationId?: string;
  periodYear?: number;
  docType?: string;
  mimeType?: string;
  createdAt: number;
}

export type ImporterRequestStatus = "acik" | "hazirlaniyor" | "gonderildi" | "onaylandi";

export interface ImporterRequest {
  id: string;
  organizationId: string;
  customerName: string;
  requestedAt: number;
  dueDate: number;
  requestedProductIds: string[];
  status: ImporterRequestStatus;
  linkedPackageId?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type SupplierRequestStatus = "gonderildi" | "goruntulendi" | "yanitlandi" | "reddedildi" | "onaylandi";

export interface SupplierRequest {
  id: string;
  organizationId: string;
  precursorId: string;
  productId: string;
  precursorName: string;
  organizationName: string;
  supplierName: string;
  supplierEmail: string;
  token: string;
  status: SupplierRequestStatus;
  sentAt: number;
  viewedAt?: number;
  respondedAt?: number;
  reminderSentAt7?: number;
  reminderSentAt14?: number;
  declaredValue?: number;
  declaredMethod?: string;
  documentId?: string;
  declineReason?: string;
  createdAt: number;
  updatedAt: number;
}

export type DocumentCheckStatus = "yesil" | "sari" | "kirmizi";

export interface DocumentCheck {
  id: string;
  organizationId: string;
  documentId: string;
  status: DocumentCheckStatus;
  typeMatches: boolean;
  periodMatches: boolean;
  amountMatches: boolean;
  unitMatches: boolean;
  explanationTr: string;
  checkedAt: number;
}

export interface PeriodExplanation {
  id: string;
  organizationId: string;
  calculationId: string;
  processId: string;
  periodYear: number;
  periodQuarter?: 1 | 2 | 3 | 4;
  draftSummaryTr: string;
  draftCausesTr: string[];
  finalSummaryTr: string;
  approved: boolean;
  approvedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string;
  collection: string;
  documentId: string;
  changeSummary?: string;
  createdAt: number;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  createdAt: number;
}

export interface CalculatorLeadEntry {
  id: string;
  email: string;
  sector: Sector;
  cnCodePrefix: string;
  annualExportTon: number;
  euCustomerCount: number;
  inScope: boolean;
  createdAt: number;
}
