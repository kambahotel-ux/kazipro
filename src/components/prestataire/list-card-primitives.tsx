import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ListCardMeta({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ListCardBudgetPanel({
  label,
  value,
  hint,
  className,
}: {
  label?: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/15 bg-gradient-to-br from-primary/8 via-muted/20 to-background px-4 py-3",
        className,
      )}
    >
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      ) : null}
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-primary sm:text-xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function urgencyAccentClass(urgence: string): string {
  switch (urgence) {
    case "urgent":
      return "border-l-orange-500";
    case "tres_urgent":
      return "border-l-destructive";
    default:
      return "border-l-primary/50";
  }
}

/** Accent bordure gauche — statut demande (vue client). */
export function demandeStatusAccentClass(status: string): string {
  switch (status) {
    case "active":
      return "border-l-warning";
    case "in_progress":
      return "border-l-info";
    case "completed":
      return "border-l-success";
    case "cancelled":
      return "border-l-destructive";
    default:
      return "border-l-primary/50";
  }
}

export function DashboardPreviewLink({
  to,
  accentClass = "border-l-primary/50",
  title,
  meta,
  footer,
  badge,
}: {
  to: string;
  accentClass?: string;
  title: string;
  meta?: ReactNode;
  footer?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border/80 border-l-4 bg-card p-3 shadow-sm transition-all",
        "hover:border-primary/30 hover:bg-muted/30 hover:shadow-md",
        accentClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {title}
        </p>
        {badge}
      </div>
      {meta ? <div className="mt-2 flex flex-wrap gap-1.5">{meta}</div> : null}
      {footer ? <div className="mt-2">{footer}</div> : null}
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Ouvrir
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
