-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop and recreate function
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- Recreate ALL policies
-- user_roles policies
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Support can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'support'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- chat_sessions policies
CREATE POLICY "Support can view assigned sessions" ON public.chat_sessions FOR SELECT USING (public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Support can update sessions" ON public.chat_sessions FOR UPDATE USING (public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);

-- support_messages policies
CREATE POLICY "Users can view messages in their sessions" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = support_messages.session_id AND chat_sessions.user_id = auth.uid()) OR public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create messages in their sessions" ON public.support_messages FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = support_messages.session_id AND chat_sessions.user_id = auth.uid() AND support_messages.sender_type = 'user')) OR ((public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin')) AND sender_type = 'support'));

-- profiles policies
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- support_contacts policies
CREATE POLICY "Support staff can view all support contacts" ON public.support_contacts FOR SELECT USING (public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Support staff can update support contacts" ON public.support_contacts FOR UPDATE USING (public.has_role(auth.uid(), 'support') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete support contacts" ON public.support_contacts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can create support contacts" ON public.support_contacts FOR INSERT WITH CHECK (true);

-- subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- user_subscriptions policies
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);