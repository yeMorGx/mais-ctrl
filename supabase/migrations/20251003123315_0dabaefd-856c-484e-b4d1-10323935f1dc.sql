-- Create table for password reset codes
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL
);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);

-- Policy to allow inserting codes (public can request reset)
CREATE POLICY "Allow insert password reset codes"
ON public.password_reset_codes
FOR INSERT
TO public
WITH CHECK (true);

-- Policy to allow selecting own codes (for verification)
CREATE POLICY "Allow select password reset codes"
ON public.password_reset_codes
FOR SELECT
TO public
USING (true);

-- Policy to allow updating codes (to mark as used)
CREATE POLICY "Allow update password reset codes"
ON public.password_reset_codes
FOR UPDATE
TO public
USING (true);

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_codes
  WHERE expires_at < NOW() OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$;

-- Add comment
COMMENT ON TABLE public.password_reset_codes IS 'Stores temporary 4-digit verification codes for password reset functionality';