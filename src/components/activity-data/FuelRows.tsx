"use client";

import { Plus, Trash2, Paperclip } from "lucide-react";
import type { DataQuality, FuelEntry, FuelType } from "@/lib/types";
import { FUEL_FACTORS } from "@/lib/config/emission-factors";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImportSourceBadge } from "@/components/import/ImportSourceBadge";

const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  olculmus: "Ölçülmüş (fatura/sayaç)",
  hesaplanmis: "Hesaplanmış",
  tahmin: "Tahmin",
};

interface FuelRowsProps {
  fuels: FuelEntry[];
  onChange: (fuels: FuelEntry[]) => void;
  onUploadDocument: (index: number, file: File) => void;
}

export function FuelRows({ fuels, onChange, onUploadDocument }: FuelRowsProps) {
  function addRow() {
    onChange([...fuels, { fuelType: "dogalgaz", quantity: 0, unit: FUEL_FACTORS.dogalgaz.unit, dataQuality: "tahmin" }]);
  }
  function updateRow(i: number, patch: Partial<FuelEntry>) {
    const next = [...fuels];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function removeRow(i: number) {
    onChange(fuels.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {fuels.map((f, i) => (
        <div key={i} className="rounded border border-base-border bg-base-surface2 p-3">
        {f.importSource && f.importSource !== "manual" && (
          <div className="mb-2"><ImportSourceBadge source={f.importSource} /></div>
        )}
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-3">
            <Select
              value={f.fuelType}
              onChange={(e) => {
                const fuelType = e.target.value as FuelType;
                updateRow(i, { fuelType, unit: FUEL_FACTORS[fuelType].unit });
              }}
            >
              {Object.entries(FUEL_FACTORS).map(([key, factor]) => (
                <option key={key} value={key}>
                  {factor.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min={0}
              step="any"
              value={f.quantity}
              onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
              placeholder="Miktar"
            />
          </div>
          <div className="col-span-2 text-xs text-ink-faint self-center">{f.unit}</div>
          <div className="col-span-3">
            <Select value={f.dataQuality} onChange={(e) => updateRow(i, { dataQuality: e.target.value as DataQuality })}>
              {Object.entries(DATA_QUALITY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-1 flex justify-center">
            <label className="cursor-pointer text-ink-faint hover:text-steel">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadDocument(i, e.target.files[0])}
              />
            </label>
          </div>
          <div className="col-span-1 flex justify-center">
            <button type="button" onClick={() => removeRow(i)} className="text-ink-faint hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" /> Yakıt Ekle
      </Button>
    </div>
  );
}

export { DATA_QUALITY_LABELS };
