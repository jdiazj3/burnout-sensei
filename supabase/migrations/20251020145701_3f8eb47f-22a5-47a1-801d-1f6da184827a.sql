-- RLS Policies for companies table
CREATE POLICY "Admins can manage all companies"
ON public.companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company admins can view their company"
ON public.companies
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'company_admin'::app_role) AND
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Update profiles RLS policies
CREATE POLICY "Company admins can view users in their company"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'company_admin'::app_role) AND
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Update surveys RLS policies
CREATE POLICY "Company admins can view surveys from their company"
ON public.surveys
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'company_admin'::app_role) AND
  user_id IN (SELECT user_id FROM public.profiles WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())))
);