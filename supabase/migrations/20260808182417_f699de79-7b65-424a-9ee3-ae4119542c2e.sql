CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT,
  loan_type TEXT NOT NULL DEFAULT 'personal',
  principal_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  installment_value NUMERIC NOT NULL DEFAULT 0,
  total_installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  due_day INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loans" ON public.loans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_payments TO authenticated;
GRANT ALL ON public.loan_payments TO service_role;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own loan payments" ON public.loan_payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_loan_payments_updated_at BEFORE UPDATE ON public.loan_payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_loans_user ON public.loans(user_id);
CREATE INDEX idx_loan_payments_loan ON public.loan_payments(loan_id);