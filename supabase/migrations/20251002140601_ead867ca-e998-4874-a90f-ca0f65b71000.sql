-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Support can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Recreate the policy for users to view their own roles (this is critical!)
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all roles using the has_role function
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow support to view all roles
CREATE POLICY "Support can view all roles"
ON user_roles FOR SELECT
USING (has_role(auth.uid(), 'support'));