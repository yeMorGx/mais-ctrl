-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Users can view their own shared subscriptions" ON shared_subscriptions;
DROP POLICY IF EXISTS "Users can view shared subscriptions they are partners in" ON shared_subscriptions;
DROP POLICY IF EXISTS "Users can create their own shared subscriptions" ON shared_subscriptions;
DROP POLICY IF EXISTS "Users can update their own shared subscriptions" ON shared_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own shared subscriptions" ON shared_subscriptions;

-- Recriar políticas sem recursão
CREATE POLICY "Users can view their own shared subscriptions"
ON shared_subscriptions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own shared subscriptions"
ON shared_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shared subscriptions"
ON shared_subscriptions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own shared subscriptions"
ON shared_subscriptions
FOR DELETE
USING (user_id = auth.uid());

-- Criar função helper para verificar se usuário é parceiro
CREATE OR REPLACE FUNCTION public.is_subscription_partner(_subscription_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shared_subscription_partners
    WHERE shared_subscription_id = _subscription_id
      AND user_id = _user_id
  )
$$;

-- Política para parceiros verem assinatura
CREATE POLICY "Partners can view shared subscriptions"
ON shared_subscriptions
FOR SELECT
USING (public.is_subscription_partner(id, auth.uid()));