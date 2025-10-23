-- Tabla para tracking de encuestas por empresa
CREATE TABLE public.company_survey_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  surveys_included INTEGER NOT NULL DEFAULT 5, -- encuestas incluidas en el periodo actual
  surveys_used INTEGER NOT NULL DEFAULT 0, -- encuestas usadas en el periodo actual
  trial_surveys_remaining INTEGER NOT NULL DEFAULT 5, -- encuestas de prueba restantes
  is_trial_active BOOLEAN NOT NULL DEFAULT true, -- si está en periodo de prueba
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Tabla de historial de pagos
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mercadopago_payment_id TEXT, -- ID del pago en Mercado Pago
  mercadopago_preference_id TEXT, -- ID de la preferencia creada
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  surveys_purchased INTEGER NOT NULL DEFAULT 100,
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.company_survey_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policies para company_survey_limits
CREATE POLICY "Company admins can view their company limits"
ON public.company_survey_limits
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Admins can manage all limits"
ON public.company_survey_limits
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para payment_history
CREATE POLICY "Company admins can view their company payments"
ON public.payment_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Admins can manage all payments"
ON public.payment_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_company_survey_limits_updated_at
BEFORE UPDATE ON public.company_survey_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_history_updated_at
BEFORE UPDATE ON public.payment_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para inicializar límites de encuestas al crear una empresa
CREATE OR REPLACE FUNCTION public.initialize_company_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_survey_limits (company_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.initialize_company_limits();

-- Índices para mejorar performance
CREATE INDEX idx_company_survey_limits_company_id ON public.company_survey_limits(company_id);
CREATE INDEX idx_payment_history_company_id ON public.payment_history(company_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);