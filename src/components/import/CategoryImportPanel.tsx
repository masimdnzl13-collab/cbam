"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ParsedSheet } from "@/lib/import/parse-file";
import {
  FUEL_TARGET_FIELDS,
  ELECTRICITY_TARGET_FIELDS,
  MATERIAL_TARGET_FIELDS,
  OUTPUT_TARGET_FIELDS,
  autoMapColumns,
  type TargetField,
} from "@/lib/import/column-mapper";
import { suggestUnitConversion } from "@/lib/import/unit-conversion";
import { matchDataQuality, matchFuelType, matchSourceType } from "@/lib/import/value-matchers";
import { FUEL_FACTORS } from "@/lib/config/emission-factors";
import { Select, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import type { DataQuality, ElectricitySourceType, FuelType } from "@/lib/types";

export type ImportCategory = "yakit" | "elektrik" | "hammadde" | "uretim";

export interface MappedFuelRow {
  fuelType: FuelType;
  quantity: number;
  unit: string;
  dataQuality: DataQuality;
}
export interface MappedElectricityRow {
  totalConsumptionKwh: number;
  sourceType: ElectricitySourceType;
  dataQuality: DataQuality;
}
export interface MappedMaterialRow {
  materialName: string;
  quantity: number;
  unit: string;
  dataQuality: DataQuality;
}
export interface MappedOutputRow {
  outputQuantityTon: number;
}

const FIELD_SETS: Record<ImportCategory, TargetField[]> = {
  yakit: FUEL_TARGET_FIELDS,
  elektrik: ELECTRICITY_TARGET_FIELDS,
  hammadde: MATERIAL_TARGET_FIELDS,
  uretim: OUTPUT_TARGET_FIELDS,
};

const CATEGORY_LABELS: Record<ImportCategory, string> = {
  yakit: "Yakıt Tüketimi",
  elektrik: "Elektrik",
  hammadde: "Hammadde",
  uretim: "Üretim Miktarı",
};

interface CategoryImportPanelProps {
  category: ImportCategory;
  sheet: ParsedSheet;
  onMappedRowsChange: (rows: (MappedFuelRow | MappedElectricityRow | MappedMaterialRow | MappedOutputRow)[]) => void;
}

export function CategoryImportPanel({ category, sheet, onMappedRowsChange }: CategoryImportPanelProps) {
  const fields = FIELD_SETS[category];
  const [mapping, setMapping] = useState<Record<string, string | null>>(() => autoMapColumns(sheet.headers, fields));

  const { mappedRows, warnings } = useMemo(() => {
    const warn: string[] = [];
    const rows = sheet.rows.map((row) => {
      const get = (key: string) => (mapping[key] ? row[mapping[key]!] ?? "" : "");

      if (category === "yakit") {
        const fuelLabel = get("fuelType");
        const fuelType = matchFuelType(fuelLabel) ?? "diger";
        const expectedUnit = FUEL_FACTORS[fuelType].unit;
        const foundUnit = get("unit") || expectedUnit;
        const conv = suggestUnitConversion(foundUnit, expectedUnit);
        if (conv.needsConversion && conv.message) warn.push(conv.message);
        const quantity = (parseFloat(get("quantity").replace(",", ".")) || 0) * conv.factor;
        return { fuelType, quantity, unit: expectedUnit, dataQuality: matchDataQuality(get("dataQuality")) } as MappedFuelRow;
      }

      if (category === "elektrik") {
        const foundUnit = get("unit") || "kWh";
        const conv = suggestUnitConversion(foundUnit, "kWh");
        if (conv.needsConversion && conv.message) warn.push(conv.message);
        const totalConsumptionKwh = (parseFloat(get("quantity").replace(",", ".")) || 0) * conv.factor;
        return {
          totalConsumptionKwh,
          sourceType: matchSourceType(get("sourceType")),
          dataQuality: matchDataQuality(get("dataQuality")),
        } as MappedElectricityRow;
      }

      if (category === "hammadde") {
        return {
          materialName: get("materialName") || "-",
          quantity: parseFloat(get("quantity").replace(",", ".")) || 0,
          unit: get("unit") || "ton",
          dataQuality: matchDataQuality(get("dataQuality")),
        } as MappedMaterialRow;
      }

      // uretim
      const foundUnit = get("unit") || "ton";
      const conv = suggestUnitConversion(foundUnit, "ton");
      if (conv.needsConversion && conv.message) warn.push(conv.message);
      const outputQuantityTon = (parseFloat(get("quantity").replace(",", ".")) || 0) * conv.factor;
      return { outputQuantityTon } as MappedOutputRow;
    });
    return { mappedRows: rows, warnings: Array.from(new Set(warn)) };
  }, [mapping, sheet.rows, category]);

  useEffect(() => {
    onMappedRowsChange(mappedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedRows]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-muted mb-2">
          {CATEGORY_LABELS[category]} — Sütun Eşleme
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>
                {f.label} {f.required && <span className="text-danger">*</span>}
              </Label>
              <Select
                value={mapping[f.key] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
              >
                <option value="">Eşleme yok</option>
                {sheet.headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-warning/30 bg-warning/5 p-2 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {w}
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-ink-muted mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Önizleme ({mappedRows.length} satır)
        </p>
        <div className="max-h-56 overflow-y-auto rounded border border-base-border">
          <Table>
            <THead>
              <TR>
                {Object.keys(mappedRows[0] ?? {}).map((k) => (
                  <TH key={k}>{k}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {mappedRows.slice(0, 10).map((row, i) => (
                <TR key={i}>
                  {Object.values(row).map((v, j) => (
                    <TD key={j} className="font-tabular text-xs">{String(v)}</TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>
      <Badge tone="steel">{sheet.rows.length} satır bulundu</Badge>
    </div>
  );
}
