import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "steel" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-base-surface2 text-ink-muted border-base-border",
  accent: "bg-accent/10 text-accent border-accent/30",
  steel: "bg-steel/10 text-steel border-steel/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
