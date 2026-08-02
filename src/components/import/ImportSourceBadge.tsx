import { Badge } from "@/components/ui/Badge";
import type { ImportSource } from "@/lib/types";

const LABELS: Record<ImportSource, string> = {
  manual: "Elle",
  excel: "Excel'den",
  csv: "CSV'den",
  pdf: "PDF'ten",
};

export function ImportSourceBadge({ source }: { source?: ImportSource }) {
  if (!source || source === "manual") return null;
  return (
    <Badge tone="steel" className="shrink-0">
      {LABELS[source]}
    </Badge>
  );
}
