-- Add RLS policies for admins to view and manage all user subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON user_subscriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
ON user_subscriptions FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert any subscription"
ON user_subscriptions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any subscription"
ON user_subscriptions FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to view all profiles
-- (Already exists but ensuring it's there)