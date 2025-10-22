-- Allow anyone to view companies for registration
CREATE POLICY "Anyone can view companies for registration"
ON public.companies
FOR SELECT
TO public
USING (true);