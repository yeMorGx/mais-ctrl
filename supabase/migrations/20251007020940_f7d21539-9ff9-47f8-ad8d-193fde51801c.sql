-- Remove dangerous public access policies from password_reset_codes table
-- Password reset codes should NEVER be readable by clients - only server-side validation

-- Drop the existing permissive policies
DROP POLICY IF EXISTS "Allow select password reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Allow insert password reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Allow update password reset codes" ON public.password_reset_codes;

-- No new policies needed - RLS is enabled but only service role can access
-- This is secure because:
-- 1. send-reset-code edge function uses service role to INSERT codes
-- 2. verify-reset-code edge function uses service role to SELECT and UPDATE codes
-- 3. Clients can never read or manipulate reset codes directly