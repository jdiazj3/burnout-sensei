-- Permitir a los company_admin insertar registros de pago para su propia empresa
CREATE POLICY "Company admins can insert payments for their company"
ON public.payment_history
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role) 
  AND company_id = get_user_company_id(auth.uid())
);