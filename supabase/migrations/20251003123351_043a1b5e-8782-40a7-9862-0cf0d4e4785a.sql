-- Fix search_path for cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_reset_codes();

CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_codes
  WHERE expires_at < NOW() OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$;