import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const OnlineProvidersCount = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineCount();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchOnlineCount, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchOnlineCount = async () => {
    try {
      const { count } = await supabase
        .from('prestataires')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('verified', true);

      setOnlineCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du comptage des prestataires en ligne:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prestataires en ligne</p>
            {loading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-green-600">En ligne</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
