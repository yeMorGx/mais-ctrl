-- Create invites table
CREATE TABLE public.invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_subscription_id uuid NOT NULL REFERENCES public.shared_subscriptions(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email text,
  status text NOT NULL DEFAULT 'pending',
  token text UNIQUE,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their sent invites"
ON public.invites
FOR SELECT
USING (from_user_id = auth.uid());

CREATE POLICY "Users can view invites sent to their email"
ON public.invites
FOR SELECT
USING (to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can create invites for their subscriptions"
ON public.invites
FOR INSERT
WITH CHECK (
  shared_subscription_id IN (
    SELECT id FROM shared_subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update invites they received"
ON public.invites
FOR UPDATE
USING (to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Owners can update their invites"
ON public.invites
FOR UPDATE
USING (from_user_id = auth.uid());

CREATE POLICY "Owners can delete their invites"
ON public.invites
FOR DELETE
USING (from_user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_subscription ON public.invites(shared_subscription_id);
CREATE INDEX idx_invites_status ON public.invites(status);

-- Add trigger for updated_at
CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();