-- Table: affiliates (cada afiliado do programa)
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  pix_key TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: referrals (vínculos entre afiliado e usuário indicado)
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signup_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: commissions (comissões geradas por pagamentos)
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'chargeback')),
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: payout_requests (solicitações de saque)
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  pix_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'rejected')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_commissions_affiliate_id ON public.commissions(affiliate_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_available_at ON public.commissions(available_at);
CREATE INDEX idx_payout_requests_affiliate_id ON public.payout_requests(affiliate_id);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Users can view their own affiliate record"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate record"
  ON public.affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate record"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all affiliates"
  ON public.affiliates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for referrals
CREATE POLICY "Affiliates can view their own referrals"
  ON public.referrals FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view their own commissions"
  ON public.commissions FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all commissions"
  ON public.commissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all commissions"
  ON public.commissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payout_requests
CREATE POLICY "Affiliates can view their own payout requests"
  ON public.payout_requests FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can create payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all payout requests"
  ON public.payout_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all payout requests"
  ON public.payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    SELECT EXISTS (SELECT 1 FROM public.affiliates WHERE code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Function to get affiliate stats
CREATE OR REPLACE FUNCTION public.get_affiliate_stats(affiliate_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aff_id UUID;
  result JSON;
BEGIN
  -- Get affiliate ID
  SELECT id INTO aff_id FROM affiliates WHERE user_id = affiliate_user_id;
  
  IF aff_id IS NULL THEN
    RETURN json_build_object(
      'is_affiliate', false
    );
  END IF;
  
  SELECT json_build_object(
    'is_affiliate', true,
    'total_referrals', (SELECT COUNT(*) FROM referrals WHERE affiliate_id = aff_id),
    'approved_referrals', (SELECT COUNT(*) FROM referrals WHERE affiliate_id = aff_id AND status = 'approved'),
    'pending_commissions_cents', COALESCE((SELECT SUM(amount_cents) FROM commissions WHERE affiliate_id = aff_id AND status = 'pending'), 0),
    'available_commissions_cents', COALESCE((SELECT SUM(amount_cents) FROM commissions WHERE affiliate_id = aff_id AND status = 'available'), 0),
    'total_paid_cents', COALESCE((SELECT SUM(amount_cents) FROM commissions WHERE affiliate_id = aff_id AND status = 'paid'), 0),
    'total_earned_cents', COALESCE((SELECT SUM(amount_cents) FROM commissions WHERE affiliate_id = aff_id AND status IN ('available', 'paid')), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to release pending commissions (called by scheduled job)
CREATE OR REPLACE FUNCTION public.release_pending_commissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE commissions
  SET status = 'available', updated_at = now()
  WHERE status = 'pending' AND available_at <= now();
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();