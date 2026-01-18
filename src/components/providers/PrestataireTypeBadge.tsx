import { Badge } from '@/components/ui/badge';
import { TypePrestataire, getPrestataireTypeLabel, getPrestataireTypeIcon } from '@/types/prestataire';

interface PrestataireTypeBadgeProps {
  type: TypePrestataire;
  showIcon?: boolean;
  className?: string;
}

export default function PrestataireTypeBadge({ 
  type, 
  showIcon = true,
  className 
}: PrestataireTypeBadgeProps) {
  const icon = getPrestataireTypeIcon(type);
  const label = getPrestataireTypeLabel(type);
  
  const variant = type === 'physique' ? 'default' : 'secondary';
  
  return (
    <Badge variant={variant} className={className}>
      {showIcon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}
