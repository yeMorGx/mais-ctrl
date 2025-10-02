-- Insert admin role for the site owner to bootstrap the system
-- This allows the owner to manage other user roles
INSERT INTO public.user_roles (user_id, role, created_by)
VALUES ('0aa7f072-7169-48f3-9389-170100fb2418', 'admin', '0aa7f072-7169-48f3-9389-170100fb2418')
ON CONFLICT (user_id, role) DO NOTHING;