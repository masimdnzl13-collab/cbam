"use client";

import { Plus, Trash2, Paperclip } from "lucide-react";
import type { DataQuality, InputMaterialEntry } from "@/lib/types";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DATA_QUALITY_LABELS } from "@/components/activity-data/FuelRows";
import { ImportSourceBadge } from "@/components/import/ImportSourceBadge";

interface InputMaterialRowsProps {
  materials: InputMaterialEntry[];
  onChange: (materials: InputMaterialEntry[]) => void;
  onUploadDocument: (index: number, file: File) => void;
}

export function InputMaterialRows({ materials, onChange, onUploadDocument }: InputMaterialRowsProps) {
  function addRow() {
    onChange([...materials, { materialName: "", quantity: 0, unit: "ton", dataQuality: "tahmin" }]);
  }
  function updateRow(i: number, patch: Partial<InputMaterialEntry>) {
    const next = [...materials];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function removeRow(i: number) {
    onChange(materials.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {materials.map((m, i) => (
        <div key={i} className="rounded border border-base-border bg-base-surface2 p-3">
        {m.importSource && m.importSource !== "manual" && (
          <div className="mb-2"><ImportSourceBadge source={m.importSource} /></div>
        )}
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <Input
              placeholder="ör. kalker, hurda, doğalgaz (hammadde)"
              value={m.materialName}
              onChange={(e) => updateRow(i, { materialName: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min={0}
              step="any"
              value={m.quantity}
              onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
              placeholder="Miktar"
            />
          </div>
          <div className="col-span-2">
            <Input value={m.unit} onChange={(e) => updateRow(i, { unit: e.target.value })} placeholder="Birim" />
          </div>
          <div className="col-span-2">
            <Select value={m.dataQuality} onChange={(e) => updateRow(i, { dataQuality: e.target.value as DataQuality })}>
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
        <Plus className="h-3.5 w-3.5" /> Girdi Malzemesi Ekle
      </Button>
    </div>
  );
}
