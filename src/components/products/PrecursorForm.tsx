"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { PrecursorSourceType, ProductionProcess } from "@/lib/types";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface PrecursorFormValues {
  name: string;
  sourceType: PrecursorSourceType;
  quantityPerOutputTon: number;
  ownProcessId?: string;
  supplierName?: string;
  supplierEmissionValue?: number;
  file?: File | null;
}

interface PrecursorFormProps {
  processes: ProductionProcess[];
  submitting?: boolean;
  onSubmit: (values: PrecursorFormValues) => void;
  onCancel?: () => void;
}

const SOURCE_OPTIONS: { value: PrecursorSourceType; label: string }[] = [
  { value: "own_process", label: "Kendi tesisimde üretiliyor" },
  { value: "supplier_with_data", label: "Tedarikçiden alınıyor — emisyon verisi var" },
  { value: "supplier_no_data", label: "Tedarikçiden alınıyor — veri yok" },
];

export function PrecursorForm({ processes, submitting, onSubmit, onCancel }: PrecursorFormProps) {
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<PrecursorSourceType>("own_process");
  const [ownProcessId, setOwnProcessId] = useState(processes[0]?.id ?? "");
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmissionValue, setSupplierEmissionValue] = useState<number>(0);
  const [quantityPerOutputTon, setQuantityPerOutputTon] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, sourceType, quantityPerOutputTon, ownProcessId, supplierName, supplierEmissionValue, file });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="precname">Öncü ürün adı</Label>
          <Input id="precname" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ratio">Tüketim oranı (ton öncü / ton ürün)</Label>
          <Input
            id="ratio"
            type="number"
            min={0}
            step="any"
            required
            value={quantityPerOutputTon}
            onChange={(e) => setQuantityPerOutputTon(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label>Kaynak tipi</Label>
        <div className="space-y-2">
          {SOURCE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 rounded border border-base-border bg-base-surface2 px-3 py-2 text-sm text-ink cursor-pointer"
            >
              <input
                type="radio"
                name="sourceType"
                checked={sourceType === o.value}
                onChange={() => setSourceType(o.value)}
                className="accent-accent"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {sourceType === "own_process" && (
        <div>
          <Label htmlFor="ownProcess">Hangi prosesten geliyor?</Label>
          <Select id="ownProcess" value={ownProcessId} onChange={(e) => setOwnProcessId(e.target.value)}>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {sourceType === "supplier_with_data" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="supplierName">Tedarikçi adı</Label>
            <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="supplierValue">Gömülü emisyon (tCO₂e/ton)</Label>
            <Input
              id="supplierValue"
              type="number"
              step="any"
              min={0}
              value={supplierEmissionValue}
              onChange={(e) => setSupplierEmissionValue(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="doc">Belge (opsiyonel)</Label>
            <input
              id="doc"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink-muted file:mr-3 file:rounded file:border-0 file:bg-base-surface2 file:px-3 file:py-1.5 file:text-xs file:text-ink"
            />
          </div>
        </div>
      )}

      {sourceType === "supplier_no_data" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="supplierName2">Tedarikçi adı (opsiyonel)</Label>
            <Input id="supplierName2" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div className="flex gap-2 rounded border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>
              Bu öncü için AB varsayılan değeri kullanılacak. Bu, ürününüzün gömülü emisyon hesabını
              yukarı çeker ve veri tamlık skorunuzu düşürür.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Kaydediliyor..." : "Öncü Ürünü Kaydet"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
      </div>
    </form>
  );
}
