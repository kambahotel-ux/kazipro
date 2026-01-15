import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface AvailabilityToggleProps {
  providerId: string | null;
}

export const AvailabilityToggle = ({ providerId }: AvailabilityToggleProps) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchAvailability();
    }
  }, [providerId]);

  const fetchAvailability = async () => {
    if (!providerId) return;

    try {
      const { data, error } = await supabase
        .from('prestataires')
        .select('is_online')
        .eq('id', providerId)
        .single();

      if (error) throw error;

      setIsAvailable(data?.is_online || false);
    } catch (error) {
      console.error('Erreur lors du chargement de la disponibilité:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!providerId || updating) return;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('prestataires')
        .update({
          is_online: checked,
          last_seen: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;

      setIsAvailable(checked);
      
      if (checked) {
        toast.success('Vous êtes maintenant disponible', {
          description: 'Les clients peuvent voir que vous êtes en ligne'
        });
      } else {
        toast.info('Vous êtes maintenant indisponible', {
          description: 'Les clients ne verront pas votre statut en ligne'
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de votre disponibilité');
    } finally {
      setUpdating(false);
    }
  };

  if (!providerId || loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-48 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-6 w-11 bg-muted animate-pulse rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all ${isAvailable ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isAvailable ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {updating ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              ) : isAvailable ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <Label 
                htmlFor="availability-toggle" 
                className={`text-sm font-medium cursor-pointer ${
                  isAvailable ? 'text-green-700' : 'text-foreground'
                }`}
              >
                {isAvailable ? 'Vous êtes disponible' : 'Vous êtes indisponible'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isAvailable 
                  ? 'Les clients peuvent voir que vous êtes en ligne'
                  : 'Les clients ne verront pas votre statut en ligne'
                }
              </p>
            </div>
          </div>
          <Switch
            id="availability-toggle"
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={updating}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
        
        {isAvailable && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Visible par les clients maintenant</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
