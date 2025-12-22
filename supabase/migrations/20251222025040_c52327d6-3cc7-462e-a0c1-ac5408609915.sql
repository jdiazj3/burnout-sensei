-- Crear tabla para encuestas de salud laboral
CREATE TABLE public.health_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Datos demográficos
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  
  -- Condiciones de salud (array de condiciones seleccionadas)
  health_conditions TEXT[] DEFAULT '{}',
  
  -- Actividad física
  physical_activity_frequency TEXT NOT NULL,
  sedentary_hours INTEGER,
  active_breaks BOOLEAN DEFAULT false,
  physical_pain_areas TEXT[] DEFAULT '{}',
  
  -- Nutrición
  meals_per_day INTEGER NOT NULL,
  food_types TEXT[] DEFAULT '{}',
  water_intake TEXT,
  caffeine_consumption TEXT,
  
  -- Descanso y sueño
  sleep_hours INTEGER,
  sleep_quality TEXT,
  work_disconnection TEXT,
  daily_fatigue TEXT,
  
  -- Chequeos médicos
  medical_checkup_frequency TEXT,
  
  -- Ambiente laboral
  ergonomic_setup TEXT,
  screen_exposure_hours INTEGER,
  
  -- Respuestas completas en JSON
  responses JSONB NOT NULL DEFAULT '{}',
  
  -- Puntuaciones calculadas
  physical_health_score INTEGER DEFAULT 0,
  nutrition_score INTEGER DEFAULT 0,
  rest_score INTEGER DEFAULT 0,
  overall_health_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'bajo',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_surveys ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own health surveys"
ON public.health_surveys
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health surveys"
ON public.health_surveys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health surveys"
ON public.health_surveys
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_health_surveys_updated_at
BEFORE UPDATE ON public.health_surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla para almacenar recomendaciones de salud
CREATE TABLE public.health_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.health_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_recommendations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own health recommendations"
ON public.health_recommendations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health recommendations"
ON public.health_recommendations
FOR INSERT
WITH CHECK (auth.uid() = user_id);