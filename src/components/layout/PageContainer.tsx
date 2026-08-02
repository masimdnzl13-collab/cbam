import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageContainer({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 py-8", className)} {...props}>
      {(title || actions) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h1 className="font-heading text-xl font-semibold text-ink">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-ink-muted max-w-2xl">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
