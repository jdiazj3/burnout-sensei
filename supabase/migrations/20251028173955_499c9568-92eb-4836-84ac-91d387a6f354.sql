-- Crear función para incrementar surveys_used cuando se crea una encuesta
CREATE OR REPLACE FUNCTION public.increment_surveys_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  FOR UPDATE; -- Lock para evitar race conditions

  -- Verificar si puede crear la encuesta
  IF company_limits.is_trial_active THEN
    -- En periodo de prueba
    IF company_limits.trial_surveys_remaining <= 0 THEN
      RAISE EXCEPTION 'Ha agotado las encuestas de prueba disponibles';
    END IF;
    
    -- Decrementar encuestas de prueba
    UPDATE public.company_survey_limits
    SET trial_surveys_remaining = trial_surveys_remaining - 1
    WHERE company_id = user_company_id;
  ELSE
    -- Periodo de pago
    IF company_limits.surveys_used >= company_limits.surveys_included THEN
      RAISE EXCEPTION 'Ha alcanzado el límite de encuestas incluidas';
    END IF;
    
    -- Incrementar encuestas usadas
    UPDATE public.company_survey_limits
    SET surveys_used = surveys_used + 1
    WHERE company_id = user_company_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta ANTES de insertar una encuesta
DROP TRIGGER IF EXISTS trigger_increment_surveys_used ON public.surveys;
CREATE TRIGGER trigger_increment_surveys_used
BEFORE INSERT ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.increment_surveys_used();