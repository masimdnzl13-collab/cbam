import { formatNumber } from "@/lib/utils";

export interface WaterfallStep {
  label: string;
  value: number;
  color: string;
  isTotal?: boolean;
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
}

export function WaterfallChart({ steps }: WaterfallChartProps) {
  const total = Math.max(...steps.filter((s) => s.isTotal).map((s) => s.value), 1);
  let cumulative = 0;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const start = step.isTotal ? 0 : cumulative;
        const width = (step.value / total) * 100;
        const offset = (start / total) * 100;
        if (!step.isTotal) cumulative += step.value;

        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-muted">{step.label}</span>
              <span className="font-tabular text-xs text-ink">{formatNumber(step.value, 1)} tCO₂e</span>
            </div>
            <div className="h-5 w-full rounded bg-base-surface2 relative overflow-hidden">
              <div
                className="absolute h-full rounded"
                style={{
                  left: `${offset}%`,
                  width: `${Math.max(width, 0.5)}%`,
                  backgroundColor: step.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
