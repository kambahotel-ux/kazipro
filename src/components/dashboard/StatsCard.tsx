import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  iconClassName?: string;
  shortTitle?: string;
  compact?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  active,
  onClick,
  iconClassName,
  shortTitle,
  compact,
  href,
}: StatsCardProps) {
  const interactive = Boolean(onClick || href);

  const content = (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 text-left",
        interactive && "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold uppercase text-muted-foreground",
            compact
              ? "text-[10px] leading-tight tracking-wide"
              : "truncate text-xs tracking-[0.08em]",
          )}
        >
          {shortTitle ? (
            <>
              <span className="sm:hidden">{shortTitle}</span>
              <span className="hidden sm:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </p>
        <p
          className={cn(
            "mt-1 font-bold leading-tight tabular-nums",
            compact ? "text-lg sm:mt-2 sm:text-xl md:text-2xl" : "mt-2 text-xl md:text-2xl",
          )}
        >
          {value}
        </p>
        {subtitle ? (
          <p
            className={cn(
              "truncate text-muted-foreground",
              compact ? "mt-0.5 hidden text-[10px] sm:mt-1 sm:block sm:text-xs" : "mt-1 text-xs",
            )}
          >
            {subtitle}
          </p>
        ) : null}
        {trend ? (
          <p
            className={cn(
              "mt-2 text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive",
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}% vs mois dernier
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg",
          compact ? "h-9 w-9" : "ml-1 h-10 w-10 rounded-xl md:h-11 md:w-11",
          iconClassName ?? "bg-accent text-primary",
        )}
      >
        {icon}
      </div>
    </div>
  );

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        interactive && "cursor-pointer hover:border-primary/40 hover:shadow-md",
        active && "border-primary/50 shadow-md ring-2 ring-primary/15",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex items-center",
          compact ? "min-h-[76px] p-3 sm:min-h-[92px] sm:p-4 md:p-5" : "min-h-[92px] p-4 md:p-5",
        )}
      >
        {href ? (
          <Link to={href} className="block w-full">
            {content}
          </Link>
        ) : onClick ? (
          <button type="button" onClick={onClick} className="w-full">
            {content}
          </button>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
}
