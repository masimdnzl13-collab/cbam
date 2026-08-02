"use client";

import { Paperclip, Info } from "lucide-react";
import type { DataQuality, ElectricityEntry, ElectricitySourceType } from "@/lib/types";
import { TURKEY_GRID_EMISSION_FACTOR } from "@/lib/config/emission-factors";
import { Input, Label, Select } from "@/components/ui/Input";
import { DATA_QUALITY_LABELS } from "@/components/activity-data/FuelRows";
import { ImportSourceBadge } from "@/components/import/ImportSourceBadge";

const SOURCE_LABELS: Record<ElectricitySourceType, string> = {
  sebeke: "Şebeke",
  tesis_ici_uretim: "Tesis içi üretim",
  yenilenebilir_ppa: "Yenilenebilir PPA",
};

interface ElectricityBlockProps {
  value: ElectricityEntry | undefined;
  onChange: (value: ElectricityEntry) => void;
  onUploadPpaDocument: (file: File) => void;
}

export function ElectricityBlock({ value, onChange, onUploadPpaDocument }: ElectricityBlockProps) {
  const entry: ElectricityEntry = value ?? {
    totalConsumptionKwh: 0,
    sourceType: "sebeke",
    dataQuality: "tahmin",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {entry.importSource && entry.importSource !== "manual" && (
        <div className="sm:col-span-3"><ImportSourceBadge source={entry.importSource} /></div>
      )}
      <div>
        <Label>Toplam tüketim (kWh)</Label>
        <Input
          type="number"
          min={0}
          value={entry.totalConsumptionKwh}
          onChange={(e) => onChange({ ...entry, totalConsumptionKwh: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Kaynak tipi</Label>
        <Select
          value={entry.sourceType}
          onChange={(e) => onChange({ ...entry, sourceType: e.target.value as ElectricitySourceType })}
        >
          {Object.entries(SOURCE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Veri kalitesi</Label>
        <Select value={entry.dataQuality} onChange={(e) => onChange({ ...entry, dataQuality: e.target.value as DataQuality })}>
          {Object.entries(DATA_QUALITY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {entry.sourceType === "sebeke" && (
        <div className="sm:col-span-3 flex gap-2 rounded border border-steel/30 bg-steel/5 p-3 text-xs text-ink-muted">
          <Info className="h-4 w-4 shrink-0 text-steel" />
          <p>
            Türkiye şebeke emisyon faktörü otomatik uygulanır: {TURKEY_GRID_EMISSION_FACTOR.valueTco2PerMwh} tCO₂e/MWh
            ({TURKEY_GRID_EMISSION_FACTOR.source}).
          </p>
        </div>
      )}

      {entry.sourceType === "yenilenebilir_ppa" && (
        <div className="sm:col-span-3 flex items-center gap-3 rounded border border-success/30 bg-success/5 p-3 text-xs text-ink-muted">
          <span className="flex-1">
            PPA (Güç Alım Anlaşması) belgeleyerek bu elektriğin dolaylı emisyonunu düşürebilirsiniz.
          </span>
          <label className="cursor-pointer flex items-center gap-1 text-steel hover:underline">
            <Paperclip className="h-4 w-4" />
            Sözleşme yükle
            <input
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUploadPpaDocument(e.target.files[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
}
