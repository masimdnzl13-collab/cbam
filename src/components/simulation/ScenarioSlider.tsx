interface ScenarioSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}

export function ScenarioSlider({ label, value, onChange, hint }: ScenarioSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-ink">{label}</label>
        <span className="font-tabular text-sm text-accent">%{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
