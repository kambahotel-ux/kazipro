import React from 'react';
import { MethodePaiement } from '@/types/paiement';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Check, CreditCard, Wallet, Smartphone, Banknote, Landmark } from 'lucide-react';

interface MethodePaiementOption {
  id: MethodePaiement;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface MethodePaiementSelectorProps {
  selected?: MethodePaiement;
  onChange: (methode: MethodePaiement) => void;
  className?: string;
  disabledMethods?: MethodePaiement[];
}

/**
 * Composant de sélection de la méthode de paiement
 * Présente les options sous forme de cartes cliquables optimisées pour le mobile
 */
export const MethodePaiementSelector: React.FC<MethodePaiementSelectorProps> = ({
  selected,
  onChange,
  className,
  disabledMethods = [],
}) => {
  const methodes: MethodePaiementOption[] = [
    {
      id: 'mpesa',
      label: 'M-Pesa',
      description: 'Paiement mobile Vodacom',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      id: 'airtel_money',
      label: 'Airtel Money',
      description: 'Paiement mobile Airtel',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      id: 'orange_money',
      label: 'Orange Money',
      description: 'Paiement mobile Orange',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    {
      id: 'carte_bancaire',
      label: 'Carte Bancaire',
      description: 'Visa, Mastercard',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'virement',
      label: 'Virement',
      description: 'Transfert bancaire',
      icon: <Landmark className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      id: 'direct',
      label: 'Paiement Direct',
      description: 'Upload de preuve manuelle',
      icon: <Wallet className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600 border-green-100',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-3', className)}>
      {methodes.map((methode) => {
        const isSelected = selected === methode.id;
        const isDisabled = disabledMethods.includes(methode.id);

        return (
          <Card
            key={methode.id}
            className={cn(
              'relative cursor-pointer transition-all duration-200 border-2',
              isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-gray-300',
              isDisabled && 'opacity-50 cursor-not-allowed grayscale'
            )}
            onClick={() => !isDisabled && onChange(methode.id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn('p-2 rounded-lg shrink-0', methode.color)}>
                {methode.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{methode.label}</p>
                <p className="text-xs text-muted-foreground truncate">{methode.description}</p>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MethodePaiementSelector;
