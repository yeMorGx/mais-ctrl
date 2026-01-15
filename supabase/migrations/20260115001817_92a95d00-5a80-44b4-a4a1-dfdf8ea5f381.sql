-- Create feedback table for emoji ratings
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  page TEXT NOT NULL,
  feature TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert feedback
CREATE POLICY "Anyone can submit feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Admins can view all feedback" 
ON public.user_feedback 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'support')
  )
);

-- Create changelog table
CREATE TABLE public.changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feature', -- feature, fix, improvement
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

-- Anyone can read published changelog entries
CREATE POLICY "Anyone can read published changelog" 
ON public.changelog 
FOR SELECT 
USING (is_published = true);

-- Only admins can manage changelog
CREATE POLICY "Admins can manage changelog" 
ON public.changelog 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Insert some initial changelog entries
INSERT INTO public.changelog (version, title, description, type, published_at) VALUES
('1.0.0', 'Lançamento oficial do +Ctrl', 'Versão inicial do +Ctrl com gerenciamento de assinaturas, alertas inteligentes e dashboard unificado.', 'feature', '2025-01-01'),
('1.1.0', 'Dashboard Unificado', 'Novo dashboard que centraliza assinaturas, tarefas e parcelas em uma única visualização com gráficos interativos.', 'feature', '2025-01-10'),
('1.2.0', 'Busca e Filtros Unificados', 'Sistema de busca e filtros que funciona em todos os módulos simultaneamente.', 'improvement', '2025-01-12'),
('1.2.1', 'Correção de bugs menores', 'Melhorias de performance e correções de bugs reportados pelos usuários.', 'fix', '2025-01-14'),
('1.3.0', 'Sistema de Feedback', 'Novo sistema de feedback rápido com emojis para avaliar funcionalidades.', 'feature', '2025-01-15');