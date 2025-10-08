-- Criar tabela de assinaturas compartilhadas
CREATE TABLE public.shared_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  renewal_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  recurring_billing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de parceiros das assinaturas compartilhadas
CREATE TABLE public.shared_subscription_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_subscription_id UUID NOT NULL REFERENCES public.shared_subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.shared_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_subscription_partners ENABLE ROW LEVEL SECURITY;

-- Políticas para shared_subscriptions
CREATE POLICY "Users can view their own shared subscriptions"
ON public.shared_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared subscriptions they are partners in"
ON public.shared_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_subscription_partners
    WHERE shared_subscription_id = shared_subscriptions.id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own shared subscriptions"
ON public.shared_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared subscriptions"
ON public.shared_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared subscriptions"
ON public.shared_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para shared_subscription_partners
CREATE POLICY "Users can view partners of their subscriptions"
ON public.shared_subscription_partners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_subscriptions
    WHERE id = shared_subscription_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Partners can view their own partnership"
ON public.shared_subscription_partners
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners can manage partners"
ON public.shared_subscription_partners
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shared_subscriptions
    WHERE id = shared_subscription_id
    AND user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_shared_subscriptions_updated_at
BEFORE UPDATE ON public.shared_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_shared_subscription_partners_updated_at
BEFORE UPDATE ON public.shared_subscription_partners
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();