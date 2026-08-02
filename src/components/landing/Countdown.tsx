"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO date
  label: string;
  sublabel: string;
}

function getRemaining(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  const hours = Math.floor((clamped / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  const seconds = Math.floor((clamped / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Countdown({ targetDate, label, sublabel }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { value: remaining.days, unit: "gün" },
    { value: remaining.hours, unit: "saat" },
    { value: remaining.minutes, unit: "dk" },
    { value: remaining.seconds, unit: "sn" },
  ];

  return (
    <div className="rounded border border-base-border bg-base-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      </div>
      <div className="flex gap-2 font-tabular">
        {units.map((u, i) => (
          <div key={i} className="flex flex-1 flex-col items-center rounded bg-base-surface2 py-2.5">
            <span className="text-2xl font-semibold text-accent leading-none">{pad(u.value)}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">{u.unit}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-muted">{sublabel}</p>
    </div>
  );
}
