CREATE TABLE public.credit_card_bills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  card_name text NOT NULL,
  reference_month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_name, reference_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_card_bills TO authenticated;
GRANT ALL ON public.credit_card_bills TO service_role;

ALTER TABLE public.credit_card_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own card bills" ON public.credit_card_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own card bills" ON public.credit_card_bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own card bills" ON public.credit_card_bills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own card bills" ON public.credit_card_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_credit_card_bills_user_month ON public.credit_card_bills (user_id, reference_month DESC);

CREATE TRIGGER update_credit_card_bills_updated_at
BEFORE UPDATE ON public.credit_card_bills
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();