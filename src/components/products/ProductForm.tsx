"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Installation, ProductionProcess } from "@/lib/types";
import { lookupCnCode } from "@/lib/config/cn-code-mapping";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ProductFormValues {
  name: string;
  cnCode: string;
  installationId: string;
  processId: string;
  annualProductionTon: number;
  annualEuExportTon: number;
}

interface ProductFormProps {
  installations: Installation[];
  processes: ProductionProcess[];
  submitting?: boolean;
  onSubmit: (values: ProductFormValues) => void;
  onCancel?: () => void;
}

export function ProductForm({ installations, processes, submitting, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState("");
  const [cnCode, setCnCode] = useState("");
  const [installationId, setInstallationId] = useState(installations[0]?.id ?? "");
  const [processId, setProcessId] = useState("");
  const [annualProductionTon, setAnnualProductionTon] = useState(0);
  const [annualEuExportTon, setAnnualEuExportTon] = useState(0);

  const lookup = useMemo(() => (cnCode.length >= 4 ? lookupCnCode(cnCode) : null), [cnCode]);
  const availableProcesses = processes.filter((p) => p.installationId === installationId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, cnCode, installationId, processId, annualProductionTon, annualEuExportTon });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pname">Ticari ad</Label>
          <Input id="pname" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cn">GTİP / CN kodu (8 hane)</Label>
          <Input
            id="cn"
            required
            maxLength={12}
            placeholder="ör. 72085100"
            value={cnCode}
            onChange={(e) => setCnCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          />
          {lookup && (
            <div className="mt-1.5">
              {lookup.matched ? (
                <Badge tone="success">{lookup.entry?.description}</Badge>
              ) : (
                <Badge tone="neutral">CBAM kapsamı dışında</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="installation">Üretildiği tesis</Label>
          <Select
            id="installation"
            value={installationId}
            onChange={(e) => {
              setInstallationId(e.target.value);
              setProcessId("");
            }}
          >
            {installations.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="process">Üretildiği proses</Label>
          <Select id="process" required value={processId} onChange={(e) => setProcessId(e.target.value)}>
            <option value="">Seç...</option>
            {availableProcesses.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="prod">Yıllık üretim (ton)</Label>
          <Input
            id="prod"
            type="number"
            min={0}
            value={annualProductionTon}
            onChange={(e) => setAnnualProductionTon(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="export">Yıllık AB ihracatı (ton)</Label>
          <Input
            id="export"
            type="number"
            min={0}
            value={annualEuExportTon}
            onChange={(e) => setAnnualEuExportTon(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || !processId}>
          {submitting ? "Kaydediliyor..." : "Ürünü Kaydet"}
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
