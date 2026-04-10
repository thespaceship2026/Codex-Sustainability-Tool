import { PropsWithChildren, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}>;

export function Card({ className, title, description, action, children }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/80 bg-white/90 p-5 shadow-panel backdrop-blur",
        className
      )}
    >
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-semibold text-ink">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
