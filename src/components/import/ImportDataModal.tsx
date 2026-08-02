"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Table2, X, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  CategoryImportPanel,
  type ImportCategory,
  type MappedElectricityRow,
  type MappedFuelRow,
  type MappedMaterialRow,
  type MappedOutputRow,
} from "@/components/import/CategoryImportPanel";
import { parseCsvFile, parseExcelFile, type ParsedSheet } from "@/lib/import/parse-file";
import { generateActivityDataTemplate } from "@/lib/import/templates";
import type { DataQuality, ElectricitySourceType, FuelType, ImportSource } from "@/lib/types";

export interface ImportResult {
  fuels: { fuelType: FuelType; quantity: number; unit: string; dataQuality: DataQuality; importSource: ImportSource }[];
  electricity?: { totalConsumptionKwh: number; sourceType: ElectricitySourceType; dataQuality: DataQuality; importSource: ImportSource };
  inputMaterials: { materialName: string; quantity: number; unit: string; dataQuality: DataQuality; importSource: ImportSource }[];
  outputQuantityTon?: number;
}

interface ImportDataModalProps {
  onClose: () => void;
  onImport: (result: ImportResult) => void;
}

type Channel = "excel" | "csv" | "pdf";

export function ImportDataModal({ onClose, onImport }: ImportDataModalProps) {
  const [channel, setChannel] = useState<Channel>("excel");

  // Excel state
  const [excelSheets, setExcelSheets] = useState<Partial<Record<ImportCategory, ParsedSheet>> | null>(null);
  const [activeTab, setActiveTab] = useState<ImportCategory | null>(null);
  const [excelMapped, setExcelMapped] = useState<Partial<Record<ImportCategory, unknown[]>>>({});

  // CSV state
  const [csvCategory, setCsvCategory] = useState<ImportCategory>("yakit");
  const [csvSheet, setCsvSheet] = useState<ParsedSheet | null>(null);
  const [csvMapped, setCsvMapped] = useState<unknown[]>([]);

  // PDF state
  const [pdfKind, setPdfKind] = useState<"yakit" | "elektrik">("yakit");
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const [pdfExtracted, setPdfExtracted] = useState<{
    fuelType: FuelType;
    quantity: number;
    unit: string;
    sourceType: ElectricitySourceType;
    supplierName: string;
    confidence: string;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function handleDownloadTemplate() {
    const wb = generateActivityDataTemplate();
    XLSX.writeFile(wb, "karbonrota-faaliyet-verisi-sablonu.xlsx");
  }

  async function handleExcelUpload(file: File) {
    const sheets = await parseExcelFile(file);
    setExcelSheets(sheets);
    const firstKey = (Object.keys(sheets) as ImportCategory[])[0] ?? null;
    setActiveTab(firstKey);
  }

  async function handleCsvUpload(file: File) {
    const sheet = await parseCsvFile(file);
    setCsvSheet(sheet);
  }

  async function handlePdfUpload(file: File) {
    setPdfExtracting(true);
    setPdfError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/extract-document", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setPdfError(data.error ?? "Belge işlenemedi");
        return;
      }
      const ex = data.extracted;
      setPdfExtracted({
        fuelType: "diger",
        quantity: ex.quantity ?? 0,
        unit: ex.unit ?? "",
        sourceType: "sebeke",
        supplierName: ex.supplierName ?? "",
        confidence: ex.confidence,
      });
    } finally {
      setPdfExtracting(false);
    }
  }

  function handleFinishExcel() {
    const fuels = ((excelMapped.yakit ?? []) as MappedFuelRow[]).map((r) => ({ ...r, importSource: "excel" as ImportSource }));
    const materials = ((excelMapped.hammadde ?? []) as MappedMaterialRow[]).map((r) => ({ ...r, importSource: "excel" as ImportSource }));
    const elecRows = (excelMapped.elektrik ?? []) as MappedElectricityRow[];
    const outputRows = (excelMapped.uretim ?? []) as MappedOutputRow[];
    onImport({
      fuels,
      inputMaterials: materials,
      electricity: elecRows[0] ? { ...elecRows[0], importSource: "excel" } : undefined,
      outputQuantityTon: outputRows[0]?.outputQuantityTon,
    });
  }

  function handleFinishCsv() {
    if (csvCategory === "yakit") {
      onImport({ fuels: (csvMapped as MappedFuelRow[]).map((r) => ({ ...r, importSource: "csv" })), inputMaterials: [] });
    } else if (csvCategory === "hammadde") {
      onImport({ fuels: [], inputMaterials: (csvMapped as MappedMaterialRow[]).map((r) => ({ ...r, importSource: "csv" })) });
    } else if (csvCategory === "elektrik") {
      const row = (csvMapped as MappedElectricityRow[])[0];
      onImport({ fuels: [], inputMaterials: [], electricity: row ? { ...row, importSource: "csv" } : undefined });
    } else {
      const row = (csvMapped as MappedOutputRow[])[0];
      onImport({ fuels: [], inputMaterials: [], outputQuantityTon: row?.outputQuantityTon });
    }
  }

  function handleFinishPdf() {
    if (!pdfExtracted) return;
    if (pdfKind === "yakit") {
      onImport({
        fuels: [
          {
            fuelType: pdfExtracted.fuelType,
            quantity: pdfExtracted.quantity,
            unit: pdfExtracted.unit,
            dataQuality: "olculmus",
            importSource: "pdf",
          },
        ],
        inputMaterials: [],
      });
    } else {
      onImport({
        fuels: [],
        inputMaterials: [],
        electricity: {
          totalConsumptionKwh: pdfExtracted.unit.toLowerCase().includes("mwh") ? pdfExtracted.quantity * 1000 : pdfExtracted.quantity,
          sourceType: pdfExtracted.sourceType,
          dataQuality: "olculmus",
          importSource: "pdf",
        },
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-ink">Veri İçe Aktar</h2>
            <button onClick={onClose} className="text-ink-faint hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-5 flex gap-1 border-b border-base-border">
            {[
              { key: "excel" as Channel, label: "Excel", icon: FileSpreadsheet },
              { key: "pdf" as Channel, label: "PDF'ten Veri Çek", icon: FileText },
              { key: "csv" as Channel, label: "CSV (Genel)", icon: Table2 },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setChannel(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  channel === t.key ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {channel === "excel" && (
            <div className="space-y-4">
              {!excelSheets && (
                <>
                  <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
                    <Download className="h-3.5 w-3.5" /> Şablonu İndir
                  </Button>
                  <div>
                    <Label>Doldurulmuş Excel dosyasını yükle</Label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && handleExcelUpload(e.target.files[0])}
                      className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                    />
                  </div>
                </>
              )}
              {excelSheets && (
                <>
                  <div className="flex gap-1 border-b border-base-border">
                    {(Object.keys(excelSheets) as ImportCategory[]).map((k) => (
                      <button
                        key={k}
                        onClick={() => setActiveTab(k)}
                        className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px ${
                          activeTab === k ? "border-accent text-accent" : "border-transparent text-ink-muted"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  {activeTab && excelSheets[activeTab] && (
                    <CategoryImportPanel
                      category={activeTab}
                      sheet={excelSheets[activeTab]!}
                      onMappedRowsChange={(rows) => setExcelMapped((m) => ({ ...m, [activeTab]: rows }))}
                    />
                  )}
                  <Button onClick={handleFinishExcel}>Tümünü İçe Aktar</Button>
                </>
              )}
            </div>
          )}

          {channel === "csv" && (
            <div className="space-y-4">
              <div>
                <Label>Bu dosya hangi veri türünü içeriyor?</Label>
                <Select value={csvCategory} onChange={(e) => setCsvCategory(e.target.value as ImportCategory)}>
                  <option value="yakit">Yakıt Tüketimi</option>
                  <option value="elektrik">Elektrik</option>
                  <option value="hammadde">Hammadde</option>
                  <option value="uretim">Üretim Miktarı</option>
                </Select>
              </div>
              <div>
                <Label>CSV dosyasını yükle</Label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                  className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                />
              </div>
              {csvSheet && (
                <>
                  <CategoryImportPanel category={csvCategory} sheet={csvSheet} onMappedRowsChange={setCsvMapped} />
                  <Button onClick={handleFinishCsv}>İçe Aktar</Button>
                </>
              )}
            </div>
          )}

          {channel === "pdf" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Elektrik faturası veya yakıt irsaliyesi gibi bir PDF/görsel yükle; Claude belgeden veriyi
                çıkarsın. Çıkarılan değerler doğrudan kaydedilmez — onaylamadan önce düzenleyebilirsin.
              </p>
              <div>
                <Label>Belge türü</Label>
                <Select value={pdfKind} onChange={(e) => setPdfKind(e.target.value as "yakit" | "elektrik")}>
                  <option value="yakit">Yakıt irsaliyesi</option>
                  <option value="elektrik">Elektrik faturası</option>
                </Select>
              </div>
              <div>
                <Label>Belge (PDF, JPEG veya PNG)</Label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                  className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
                />
              </div>
              {pdfExtracting && <p className="text-sm text-ink-muted">Belge okunuyor...</p>}
              {pdfError && <p className="text-sm text-danger">{pdfError}</p>}
              {pdfExtracted && (
                <div className="space-y-3 rounded border border-base-border bg-base-surface2 p-3">
                  <p className="text-xs text-ink-faint">
                    Güven seviyesi: <span className="text-ink">{pdfExtracted.confidence}</span> — lütfen kontrol et
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Miktar</Label>
                      <Input
                        type="number"
                        value={pdfExtracted.quantity}
                        onChange={(e) => setPdfExtracted({ ...pdfExtracted, quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Birim</Label>
                      <Input
                        value={pdfExtracted.unit}
                        onChange={(e) => setPdfExtracted({ ...pdfExtracted, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-ink-faint">Tedarikçi: {pdfExtracted.supplierName || "-"}</p>
                  <Button onClick={handleFinishPdf}>Onayla ve Ekle</Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
