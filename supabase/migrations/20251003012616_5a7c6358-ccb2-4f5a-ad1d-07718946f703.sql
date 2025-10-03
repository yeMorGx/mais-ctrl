-- Add explicit restrictive policy to deny all unauthenticated access to profiles table
-- This provides defense-in-depth security to ensure no public access is possible

CREATE POLICY "Deny all unauthenticated access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Add comment explaining the security measure
COMMENT ON POLICY "Deny all unauthenticated access to profiles" ON public.profiles IS 
'Restrictive policy that explicitly denies all unauthenticated access to prevent data scraping and ensure defense-in-depth security for sensitive user data (emails, names).';