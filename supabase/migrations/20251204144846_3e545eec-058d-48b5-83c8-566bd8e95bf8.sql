-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Support staff can view all support contacts" ON public.support_contacts;

-- Create a proper PERMISSIVE SELECT policy that only allows support/admin
CREATE POLICY "Support staff can view all support contacts"
ON public.support_contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'support'::text) OR has_role(auth.uid(), 'admin'::text));