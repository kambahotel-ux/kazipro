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
}

export function StatsCard({ title, value, subtitle, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-3 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-lg md:text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs mt-2 font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}>
                {trend.positive ? "+" : ""}{trend.value}% vs mois dernier
              </p>
            )}
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 ml-2">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
