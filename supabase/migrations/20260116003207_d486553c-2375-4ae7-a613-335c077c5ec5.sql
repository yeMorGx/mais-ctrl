-- Add phone_number column to profiles table for SMS/WhatsApp notifications
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add show_on_landing column to user_feedback table for admin to select which feedbacks appear on landing
ALTER TABLE public.user_feedback 
ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN DEFAULT false;

-- Add attachment_url column to changelog table for attachments
ALTER TABLE public.changelog 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add is_read column to changelog for tracking which users have seen it
CREATE TABLE IF NOT EXISTS public.changelog_reads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    changelog_id UUID NOT NULL REFERENCES public.changelog(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, changelog_id)
);

-- Enable RLS on changelog_reads
ALTER TABLE public.changelog_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for changelog_reads
CREATE POLICY "Users can view their own changelog reads" 
ON public.changelog_reads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark changelogs as read" 
ON public.changelog_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create site_settings table for admin to manage site-wide settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES 
('show_development_banner', '{"enabled": true}'::jsonb),
('maintenance_mode', '{"enabled": false}'::jsonb),
('site_name', '{"value": "+Ctrl"}'::jsonb),
('support_email', '{"value": "maisctrlsuporte@gmail.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add trial_end_date column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;