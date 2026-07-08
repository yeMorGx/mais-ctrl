
CREATE OR REPLACE FUNCTION public.couple_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  partner_id uuid,
  couple_name text,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, partner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couples TO authenticated;
GRANT ALL ON public.couples TO service_role;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "couples_select_members" ON public.couples FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR partner_id = auth.uid());
CREATE POLICY "couples_insert_owner" ON public.couples FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "couples_update_members" ON public.couples FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR partner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() OR partner_id = auth.uid());
CREATE POLICY "couples_delete_owner" ON public.couples FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
CREATE TRIGGER couples_updated BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE OR REPLACE FUNCTION public.is_couple_member(_couple_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couples
    WHERE id = _couple_id AND status = 'active'
      AND (owner_id = _user_id OR partner_id = _user_id)
  )
$$;

CREATE TABLE public.couple_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  invitee_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_invites TO authenticated;
GRANT ALL ON public.couple_invites TO service_role;
ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_related" ON public.couple_invites FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
CREATE POLICY "invites_insert_sender" ON public.couple_invites FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "invites_update_related" ON public.couple_invites FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), '')));
CREATE POLICY "invites_delete_sender" ON public.couple_invites FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

CREATE TABLE public.couple_incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  recurrence text NOT NULL DEFAULT 'monthly',
  received_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_incomes TO authenticated;
GRANT ALL ON public.couple_incomes TO service_role;
ALTER TABLE public.couple_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incomes_all_members" ON public.couple_incomes FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE TRIGGER incomes_updated BEFORE UPDATE ON public.couple_incomes
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE TABLE public.couple_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  category text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  responsible text NOT NULL DEFAULT 'both',
  status text NOT NULL DEFAULT 'pending',
  recurrence text NOT NULL DEFAULT 'one_time',
  installments_total int,
  installments_current int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_expenses TO authenticated;
GRANT ALL ON public.couple_expenses TO service_role;
ALTER TABLE public.couple_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_all_members" ON public.couple_expenses FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE TRIGGER expenses_updated BEFORE UPDATE ON public.couple_expenses
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE TABLE public.couple_dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  target_amount numeric(12,2) NOT NULL DEFAULT 0,
  current_amount numeric(12,2) NOT NULL DEFAULT 0,
  deadline date,
  achieved boolean NOT NULL DEFAULT false,
  achieved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_dreams TO authenticated;
GRANT ALL ON public.couple_dreams TO service_role;
ALTER TABLE public.couple_dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dreams_all_members" ON public.couple_dreams FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE TRIGGER dreams_updated BEFORE UPDATE ON public.couple_dreams
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE TABLE public.couple_dream_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  dream_id uuid NOT NULL REFERENCES public.couple_dreams(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  contributed_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_dream_contributions TO authenticated;
GRANT ALL ON public.couple_dream_contributions TO service_role;
ALTER TABLE public.couple_dream_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dream_contrib_all_members" ON public.couple_dream_contributions FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

CREATE TABLE public.couple_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  institution text,
  invested_amount numeric(14,2) NOT NULL DEFAULT 0,
  current_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_investments TO authenticated;
GRANT ALL ON public.couple_investments TO service_role;
ALTER TABLE public.couple_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invest_all_members" ON public.couple_investments FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE TRIGGER invest_updated BEFORE UPDATE ON public.couple_investments
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE TABLE public.couple_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_assets TO authenticated;
GRANT ALL ON public.couple_assets TO service_role;
ALTER TABLE public.couple_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_all_members" ON public.couple_assets FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));
CREATE TRIGGER assets_updated BEFORE UPDATE ON public.couple_assets
  FOR EACH ROW EXECUTE FUNCTION public.couple_touch_updated_at();

CREATE TABLE public.couple_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.couple_activities TO authenticated;
GRANT ALL ON public.couple_activities TO service_role;
ALTER TABLE public.couple_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select_members" ON public.couple_activities FOR SELECT TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()));
CREATE POLICY "activities_insert_members" ON public.couple_activities FOR INSERT TO authenticated
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()) AND actor_id = auth.uid());

CREATE TABLE public.couple_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL,
  week_start date NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (couple_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_checkins TO authenticated;
GRANT ALL ON public.couple_checkins TO service_role;
ALTER TABLE public.couple_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_all_members" ON public.couple_checkins FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

CREATE TABLE public.couple_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  code text NOT NULL,
  progress numeric(5,2) NOT NULL DEFAULT 0,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (couple_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_achievements TO authenticated;
GRANT ALL ON public.couple_achievements TO service_role;
ALTER TABLE public.couple_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_all_members" ON public.couple_achievements FOR ALL TO authenticated
  USING (public.is_couple_member(couple_id, auth.uid()))
  WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

CREATE INDEX idx_couple_incomes_couple ON public.couple_incomes(couple_id);
CREATE INDEX idx_couple_expenses_couple ON public.couple_expenses(couple_id);
CREATE INDEX idx_couple_dreams_couple ON public.couple_dreams(couple_id);
CREATE INDEX idx_couple_investments_couple ON public.couple_investments(couple_id);
CREATE INDEX idx_couple_assets_couple ON public.couple_assets(couple_id);
CREATE INDEX idx_couple_activities_couple ON public.couple_activities(couple_id, created_at DESC);
