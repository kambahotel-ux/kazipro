import { Badge } from '@/components/ui/badge';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  lastSeen?: string;
  className?: string;
}

export const OnlineStatusBadge = ({ isOnline, lastSeen, className = '' }: OnlineStatusBadgeProps) => {
  if (isOnline) {
    return (
      <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
        En ligne
      </Badge>
    );
  }

  // Calculer le temps depuis la dernière activité
  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return (
        <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
          Il y a {diffMinutes} min
        </Badge>
      );
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return (
        <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
          Il y a {diffHours}h
        </Badge>
      );
    }

    const diffDays = Math.floor(diffHours / 24);
    return (
      <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
        Il y a {diffDays}j
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`bg-gray-50 text-gray-600 border-gray-200 ${className}`}>
      Hors ligne
    </Badge>
  );
};
