import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";

export type PrestataireEmptyAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
};

export type PrestataireEmptyStep = {
  label: string;
  done?: boolean;
};

type PrestataireListEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  steps?: PrestataireEmptyStep[];
  actions?: PrestataireEmptyAction[];
  className?: string;
};

export function PrestataireListEmptyState({
  icon: Icon,
  title,
  description,
  steps,
  actions = [],
  className,
}: PrestataireListEmptyStateProps) {
  return (
    <Card className={cn("overflow-hidden border-dashed border-border/80 bg-muted/20", className)}>
      <CardContent className="p-6 sm:p-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold sm:text-xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

          {steps && steps.length > 0 ? (
            <ul className="mt-6 space-y-2.5 text-left rounded-xl border border-border/70 bg-card/80 px-4 py-4">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(step.done && "text-muted-foreground line-through")}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {actions.length > 0 ? (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {actions.map((action) => {
                const btn = (
                  <Button
                    key={action.label}
                    variant={action.variant ?? "default"}
                    className="w-full sm:w-auto gap-2"
                    onClick={action.onClick}
                    asChild={Boolean(action.href)}
                  >
                    {action.href ? (
                      <Link to={action.href}>
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <>
                        {action.label}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                );
                return btn;
              })}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
