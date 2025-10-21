-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Company admins can view their company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can view users in their company" ON public.profiles;

-- Recreate non-recursive policies for companies
CREATE POLICY "Company admins can view their company"
ON public.companies
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND 
   id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Recreate non-recursive policies for profiles
CREATE POLICY "Company admins can view users in their company"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND 
   company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
);

-- Add policy to allow admins to update user profiles (assign companies)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));