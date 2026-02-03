-- Drop the RESTRICTIVE policy that's causing issues
-- This policy requires ALL policies to pass (AND logic), blocking legitimate access
DROP POLICY IF EXISTS "Deny all unauthenticated access to profiles" ON public.profiles;

-- The PERMISSIVE policies we just created will now work correctly
-- Users can access their own data OR admins can access all data