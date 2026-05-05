
-- Pluggy items (connected institutions)
CREATE TABLE public.pluggy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pluggy_item_id TEXT NOT NULL UNIQUE,
  connector_id INTEGER,
  institution_name TEXT,
  institution_logo TEXT,
  status TEXT DEFAULT 'UPDATING',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pluggy_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.pluggy_items(id) ON DELETE CASCADE,
  pluggy_account_id TEXT NOT NULL UNIQUE,
  type TEXT,
  subtype TEXT,
  name TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pluggy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.pluggy_accounts(id) ON DELETE CASCADE,
  pluggy_transaction_id TEXT NOT NULL UNIQUE,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  date TIMESTAMPTZ NOT NULL,
  category TEXT,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pluggy_tx_user_date ON public.pluggy_transactions(user_id, date DESC);

CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chat_user_created ON public.ai_chat_messages(user_id, created_at);

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.pluggy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pluggy_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pluggy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Policies: users only their own
CREATE POLICY "own_items_select" ON public.pluggy_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_items_insert" ON public.pluggy_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_items_update" ON public.pluggy_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_items_delete" ON public.pluggy_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_accounts_all" ON public.pluggy_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tx_all" ON public.pluggy_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_chat_all" ON public.ai_chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_usage_all" ON public.ai_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_pluggy_items_updated BEFORE UPDATE ON public.pluggy_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pluggy_accounts_updated BEFORE UPDATE ON public.pluggy_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_ai_usage_updated BEFORE UPDATE ON public.ai_usage FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
