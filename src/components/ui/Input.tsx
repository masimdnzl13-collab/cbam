import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded bg-base-surface2 border border-base-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
        "focus:outline-none focus:border-steel focus:ring-1 focus:ring-steel/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded bg-base-surface2 border border-base-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
        "focus:outline-none focus:border-steel focus:ring-1 focus:ring-steel/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded bg-base-surface2 border border-base-border px-3 py-2 text-sm text-ink",
        "focus:outline-none focus:border-steel focus:ring-1 focus:ring-steel/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
