-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view companies for registration" ON public.companies;

-- Create a policy for anonymous users (registration only)
CREATE POLICY "Anonymous users can view companies for registration"
ON public.companies
FOR SELECT
TO anon
USING (true);

-- The existing policies already handle:
-- - "Company admins can view their company" restricts company_admins to their own company
-- - "Admins can manage all companies" allows full admin access