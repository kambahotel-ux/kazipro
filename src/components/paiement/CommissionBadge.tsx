import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatMontant } from '@/lib/paiement-utils';
import { cn } from '@/lib/utils';
import { Percent } from 'lucide-react';

interface CommissionBadgeProps {
  montant?: number;
  pourcentage?: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Composant pour afficher le montant ou le pourcentage d'une commission KaziPro
 */
export const CommissionBadge: React.FC<CommissionBadgeProps> = ({
  montant,
  pourcentage,
  label = 'Commission KaziPro',
  className,
  size = 'sm',
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Badge
        variant="secondary"
        className={cn(
          'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 flex items-center gap-1 font-medium shadow-none',
          size === 'sm' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'
        )}
      >
        <Percent className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
        {pourcentage !== undefined && <span>{pourcentage}%</span>}
        {pourcentage !== undefined && montant !== undefined && <span className="mx-0.5 opacity-50">•</span>}
        {montant !== undefined && <span>{formatMontant(montant)}</span>}
      </Badge>
    </div>
  );
};

export default CommissionBadge;
