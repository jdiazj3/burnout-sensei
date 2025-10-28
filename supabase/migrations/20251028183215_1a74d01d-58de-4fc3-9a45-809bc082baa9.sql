
-- Insertar registros iniciales en company_survey_limits para todas las compañías existentes
INSERT INTO public.company_survey_limits (company_id, surveys_included, surveys_used, trial_surveys_remaining, is_trial_active)
SELECT 
  id as company_id,
  0 as surveys_included,
  0 as surveys_used,
  5 as trial_surveys_remaining,
  true as is_trial_active
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_survey_limits)
ON CONFLICT (company_id) DO NOTHING;

-- Crear función para inicializar límites cuando se crea una nueva compañía
CREATE OR REPLACE FUNCTION public.initialize_company_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_survey_limits (
    company_id,
    surveys_included,
    surveys_used,
    trial_surveys_remaining,
    is_trial_active
  ) VALUES (
    NEW.id,
    0,
    0,
    5,
    true
  );
  RETURN NEW;
END;
$$;

-- Crear trigger para auto-inicializar límites de nuevas compañías
DROP TRIGGER IF EXISTS trigger_initialize_company_limits ON public.companies;
CREATE TRIGGER trigger_initialize_company_limits
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.initialize_company_limits();
