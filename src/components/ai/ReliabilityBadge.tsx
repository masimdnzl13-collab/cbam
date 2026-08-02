"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { DocumentCheck } from "@/lib/types";

export function ReliabilityBadge({ check }: { check?: DocumentCheck }) {
  const [open, setOpen] = useState(false);

  if (!check) {
    return <Badge tone="neutral">Kontrol bekliyor</Badge>;
  }

  const tone = check.status === "yesil" ? "success" : check.status === "sari" ? "warning" : "danger";
  const label = check.status === "yesil" ? "Tutarlı" : check.status === "sari" ? "Kontrol et" : "Uyuşmazlık";

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)}>
        <Badge tone={tone}>{label}</Badge>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-64 rounded border border-base-border bg-base-surface2 p-3 text-xs text-ink-muted shadow-panel">
          {check.explanationTr}
        </div>
      )}
    </div>
  );
}
