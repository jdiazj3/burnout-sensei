-- Agregar nuevas columnas para conteo separado por tipo de módulo
ALTER TABLE public.company_survey_limits
ADD COLUMN IF NOT EXISTS trial_burnout_remaining integer NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS trial_health_remaining integer NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS trial_bot_remaining integer NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS burnout_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bot_used integer NOT NULL DEFAULT 0;

-- Migrar datos existentes: distribuir encuestas usadas
UPDATE public.company_survey_limits
SET 
  trial_burnout_remaining = GREATEST(0, 4 - surveys_used),
  trial_health_remaining = 4,
  trial_bot_remaining = 4,
  burnout_used = surveys_used,
  health_used = 0,
  bot_used = 0
WHERE is_trial_active = true;

-- Actualizar la función de inicialización para nuevas empresas
CREATE OR REPLACE FUNCTION public.initialize_company_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.company_survey_limits (
    company_id,
    surveys_included,
    surveys_used,
    trial_surveys_remaining,
    is_trial_active,
    trial_burnout_remaining,
    trial_health_remaining,
    trial_bot_remaining,
    burnout_used,
    health_used,
    bot_used
  ) VALUES (
    NEW.id,
    0,
    0,
    12, -- Total: 4+4+4
    true,
    4,
    4,
    4,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$function$;

-- Crear función para incrementar encuestas de burnout
CREATE OR REPLACE FUNCTION public.increment_burnout_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_company_id uuid;
  company_limits record;
BEGIN
  -- Obtener company_id del usuario
  SELECT company_id INTO user_company_id
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene compañía asignada';
  END IF;

  -- Obtener límites de la compañía
  SELECT * INTO company_limits
  FROM public.company_survey_limits
  WHERE company_id = user_company_id
  FOR UPDATE;

  -- Verificar si puede crear la encuesta
  IF company_limits.is_trial_active THEN
    IF company_limits.trial_burnout_remaining <= 0 THEN
      RAISE EXCEPTION 'LIMIT_REACHED:burnout:Ha agotado las encuestas de burnout disponibles';
    END IF;
    
    UPDATE public.company_survey_limits
    SET trial_burnout_remaining = trial_burnout_remaining - 1,
        burnout_used = burnout_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  ELSE
    IF company_limits.surveys_used >= company_limits.surveys_included THEN
      RAISE EXCEPTION 'LIMIT_REACHED:burnout:Ha alcanzado el límite de encuestas incluidas';
    END IF;
    
    UPDATE public.company_survey_limits
    SET burnout_used = burnout_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Crear función para incrementar encuestas de salud laboral
CREATE OR REPLACE FUNCTION public.increment_health_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_company_id uuid;
  company_limits record;
BEGIN
  SELECT company_id INTO user_company_id
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene compañía asignada';
  END IF;

  SELECT * INTO company_limits
  FROM public.company_survey_limits
  WHERE company_id = user_company_id
  FOR UPDATE;

  IF company_limits.is_trial_active THEN
    IF company_limits.trial_health_remaining <= 0 THEN
      RAISE EXCEPTION 'LIMIT_REACHED:health:Ha agotado las encuestas de salud laboral disponibles';
    END IF;
    
    UPDATE public.company_survey_limits
    SET trial_health_remaining = trial_health_remaining - 1,
        health_used = health_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  ELSE
    IF company_limits.surveys_used >= company_limits.surveys_included THEN
      RAISE EXCEPTION 'LIMIT_REACHED:health:Ha alcanzado el límite de encuestas incluidas';
    END IF;
    
    UPDATE public.company_survey_limits
    SET health_used = health_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Crear función para incrementar sesiones del bot
CREATE OR REPLACE FUNCTION public.increment_bot_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_company_id uuid;
  company_limits record;
BEGIN
  SELECT company_id INTO user_company_id
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no tiene compañía asignada';
  END IF;

  SELECT * INTO company_limits
  FROM public.company_survey_limits
  WHERE company_id = user_company_id
  FOR UPDATE;

  IF company_limits.is_trial_active THEN
    IF company_limits.trial_bot_remaining <= 0 THEN
      RAISE EXCEPTION 'LIMIT_REACHED:bot:Ha agotado las sesiones del bot disponibles';
    END IF;
    
    UPDATE public.company_survey_limits
    SET trial_bot_remaining = trial_bot_remaining - 1,
        bot_used = bot_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  ELSE
    IF company_limits.surveys_used >= company_limits.surveys_included THEN
      RAISE EXCEPTION 'LIMIT_REACHED:bot:Ha alcanzado el límite de sesiones incluidas';
    END IF;
    
    UPDATE public.company_survey_limits
    SET bot_used = bot_used + 1,
        surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS increment_surveys_used_trigger ON public.surveys;

-- Crear trigger para encuestas de burnout
CREATE TRIGGER increment_burnout_trigger
  BEFORE INSERT ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_burnout_used();

-- Crear trigger para encuestas de salud laboral
CREATE TRIGGER increment_health_trigger
  BEFORE INSERT ON public.health_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_health_used();

-- Crear trigger para sesiones del bot
CREATE TRIGGER increment_bot_trigger
  BEFORE INSERT ON public.exercise_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_bot_used();