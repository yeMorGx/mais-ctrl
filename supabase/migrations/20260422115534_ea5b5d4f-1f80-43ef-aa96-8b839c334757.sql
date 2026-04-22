CREATE TABLE public.financings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  institution TEXT,
  financed_amount NUMERIC NOT NULL,
  down_payment NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  term_months INTEGER NOT NULL,
  current_installment INTEGER NOT NULL DEFAULT 1,
  installment_value NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financings"
ON public.financings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financings"
ON public.financings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financings"
ON public.financings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financings"
ON public.financings
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_financings_user_id ON public.financings(user_id);
CREATE INDEX idx_financings_status ON public.financings(status);

CREATE TABLE public.financing_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financing_id UUID NOT NULL REFERENCES public.financings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_paid NUMERIC NOT NULL,
  interest_paid NUMERIC NOT NULL DEFAULT 0,
  principal_paid NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financing_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their own financings"
ON public.financing_payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments for their own financings"
ON public.financing_payments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.financings
    WHERE financings.id = financing_payments.financing_id
      AND financings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update payments for their own financings"
ON public.financing_payments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete payments for their own financings"
ON public.financing_payments
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_financing_payments_financing_id ON public.financing_payments(financing_id);
CREATE INDEX idx_financing_payments_user_id ON public.financing_payments(user_id);

CREATE TRIGGER handle_financings_updated_at
BEFORE UPDATE ON public.financings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_financing_payments_updated_at
BEFORE UPDATE ON public.financing_payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();