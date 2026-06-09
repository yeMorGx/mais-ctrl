
-- 1) Lock down password_reset_codes (service-role only)
DROP POLICY IF EXISTS "Allow insert password reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Allow select password reset codes" ON public.password_reset_codes;
DROP POLICY IF EXISTS "Allow update password reset codes" ON public.password_reset_codes;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_reset_codes FROM anon, authenticated;

-- 2) Prevent users from self-upgrading their plan
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

CREATE POLICY "Users can insert their own free subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND plan = 'free');

CREATE POLICY "Users can update only non-plan fields"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND plan = (SELECT plan FROM public.user_subscriptions WHERE user_id = auth.uid()));

-- 3) Remove client SELECT of raw 2FA secrets; verification handled server-side
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public.user_2fa;

-- Allow users to check whether 2FA is enabled (without exposing the secret) via a view
CREATE OR REPLACE VIEW public.user_2fa_status AS
SELECT user_id, is_enabled, created_at, updated_at
FROM public.user_2fa;

GRANT SELECT ON public.user_2fa_status TO authenticated;
