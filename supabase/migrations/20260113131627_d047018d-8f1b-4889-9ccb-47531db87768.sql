-- Create tasks table for To Do List
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create card_installments table for Parcelas de Cartão
CREATE TABLE public.card_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  installment_value NUMERIC NOT NULL,
  total_installments INTEGER NOT NULL,
  current_installment INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  start_date DATE NOT NULL,
  card_name TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_installments ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Card installments RLS policies
CREATE POLICY "Users can view their own installments" ON public.card_installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own installments" ON public.card_installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own installments" ON public.card_installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own installments" ON public.card_installments FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_card_installments_updated_at BEFORE UPDATE ON public.card_installments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();