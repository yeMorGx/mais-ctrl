-- Create subscription_plans table for managing different plan tiers
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, lifetime
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  max_subscriptions INTEGER, -- null = unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

-- Admins can view all plans
CREATE POLICY "Admins can view all plans"
ON subscription_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert plans
CREATE POLICY "Admins can insert plans"
ON subscription_plans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update plans
CREATE POLICY "Admins can update plans"
ON subscription_plans FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete plans
CREATE POLICY "Admins can delete plans"
ON subscription_plans FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default plans
INSERT INTO public.subscription_plans (name, description, price, billing_interval, features, is_active, is_popular)
VALUES 
  (
    'Free',
    'Plano gratuito com funcionalidades básicas',
    0.00,
    'monthly',
    '["Até 5 assinaturas", "Dashboard básico", "Suporte por email"]'::jsonb,
    true,
    false
  ),
  (
    'Premium',
    'Plano completo com todos os recursos',
    12.49,
    'monthly',
    '["Assinaturas ilimitadas", "Dashboard avançado", "Análises financeiras", "Suporte prioritário", "Alertas personalizados"]'::jsonb,
    true,
    true
  )
ON CONFLICT DO NOTHING;