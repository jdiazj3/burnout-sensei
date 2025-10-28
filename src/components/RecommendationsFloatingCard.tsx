import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecommendationsFloatingCardProps {
  onClose: () => void;
}

const RecommendationsFloatingCard = ({ onClose }: RecommendationsFloatingCardProps) => {
  const navigate = useNavigate();
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [latestDate, setLatestDate] = useState<string>('');

  useEffect(() => {
    checkLatestRecommendations();
  }, []);

  const checkLatestRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('survey_recommendations')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setHasRecommendations(true);
        setLatestDate(new Date(data.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
      }
    } catch (error) {
      console.error('Error checking recommendations:', error);
    }
  };

  if (!hasRecommendations) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
      <Card className="w-80 shadow-lg border-primary/20">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recomendaciones Disponibles</CardTitle>
          </div>
          <CardDescription>
            Última actualización: {latestDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tienes recomendaciones personalizadas basadas en tu última encuesta de burnout.
          </p>
          <Button 
            className="w-full" 
            onClick={() => navigate('/recommendations')}
          >
            Ver Recomendaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsFloatingCard;
