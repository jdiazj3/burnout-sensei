
-- Corregir los valores de surveys_included para todas las compañías en trial
UPDATE public.company_survey_limits
SET surveys_included = 5
WHERE is_trial_active = true AND surveys_included < 5;
