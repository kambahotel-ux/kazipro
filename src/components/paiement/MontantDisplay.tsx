import React from "react";
import { formatMontant } from "@/lib/paiement-utils";
import { cn } from "@/lib/utils";

export interface MontantDisplayProps {
  montant: number;
  devise?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  highlight?: boolean;
}

const sizeClasses: Record<NonNullable<MontantDisplayProps["size"]>, string> = {
  sm: "text-sm font-medium tabular-nums",
  md: "text-base font-semibold tabular-nums",
  lg: "text-xl font-semibold tabular-nums",
  xl: "text-2xl font-bold tabular-nums",
};

const MontantDisplay: React.FC<MontantDisplayProps> = ({
  montant,
  devise,
  className,
  size = "md",
  highlight,
}) => {
  return (
    <span
      className={cn(
        sizeClasses[size],
        highlight && "text-primary",
        className
      )}
    >
      {formatMontant(montant, devise)}
    </span>
  );
};

export default MontantDisplay;
