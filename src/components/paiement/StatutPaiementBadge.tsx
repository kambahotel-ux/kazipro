import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatutPaiementLabel, getStatutPaiementColor } from '@/lib/paiement-utils';
import { StatutPaiement } from '@/types/paiement';
import { cn } from '@/lib/utils';

interface StatutPaiementBadgeProps {
  statut: StatutPaiement;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

/**
 * Composant pour afficher le badge de statut d'un paiement
 * Utilise les utilitaires de paiement pour la couleur et le label
 */
export const StatutPaiementBadge: React.FC<StatutPaiementBadgeProps> = ({
  statut,
  className,
  variant = 'secondary',
}) => {
  const label = getStatutPaiementLabel(statut);
  const colorClasses = getStatutPaiementColor(statut);

  return (
    <Badge
      variant={variant}
      className={cn(
        'px-2 py-0.5 font-medium border-transparent shadow-none',
        colorClasses,
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default StatutPaiementBadge;
