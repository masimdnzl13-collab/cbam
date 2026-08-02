"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { Sector } from "@/lib/types";
import { PROCESS_TEMPLATES, FINISHING_PROCESS_WARNING } from "@/lib/config/process-templates";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface ProcessFormValues {
  templateKey: string;
  name: string;
  systemBoundaryDescription: string;
  isFinishingProcess: boolean;
}

interface ProcessFormProps {
  sector: Sector;
  submitting?: boolean;
  onSubmit: (values: ProcessFormValues) => void;
  onCancel?: () => void;
}

export function ProcessForm({ sector, submitting, onSubmit, onCancel }: ProcessFormProps) {
  const templates = PROCESS_TEMPLATES[sector] ?? [];
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? "");
  const template = templates.find((t) => t.key === templateKey);

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.systemBoundaryDescription ?? "");

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    const t = templates.find((tt) => tt.key === key);
    if (t) {
      setName(t.name);
      setDescription(t.systemBoundaryDescription);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      templateKey,
      name,
      systemBoundaryDescription: description,
      isFinishingProcess: template?.isFinishingProcess ?? false,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template">Proses şablonu</Label>
        <Select id="template" value={templateKey} onChange={(e) => handleTemplateChange(e.target.value)}>
          {templates.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      {template && (
        <div className="flex gap-2 rounded border border-steel/30 bg-steel/5 p-3 text-xs text-ink-muted">
          <Info className="h-4 w-4 shrink-0 text-steel" />
          <p>{template.systemBoundaryDescription}</p>
        </div>
      )}

      {template?.isFinishingProcess && (
        <div className="flex gap-2 rounded border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>{FINISHING_PROCESS_WARNING}</p>
        </div>
      )}

      <div>
        <Label htmlFor="name">Proses adı</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="desc">Sistem sınırı açıklaması</Label>
        <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Kaydediliyor..." : "Prosesi Kaydet"}
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
