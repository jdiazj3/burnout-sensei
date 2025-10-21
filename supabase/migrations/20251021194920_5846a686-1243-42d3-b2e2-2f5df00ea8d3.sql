-- Create security definer function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Company admins can view their company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can view users in their company" ON public.profiles;

-- Recreate non-recursive policies for companies using the function
CREATE POLICY "Company admins can view their company"
ON public.companies
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND 
   id = public.get_user_company_id(auth.uid()))
);

-- Recreate non-recursive policies for profiles using the function
CREATE POLICY "Company admins can view users in their company"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND 
   company_id = public.get_user_company_id(auth.uid()))
);