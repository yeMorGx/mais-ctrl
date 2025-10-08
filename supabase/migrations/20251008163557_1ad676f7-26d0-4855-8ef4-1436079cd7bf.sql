-- Fix infinite recursion in shared_subscriptions policies
DROP POLICY IF EXISTS "Users can view shared subscriptions they are partners in" ON shared_subscriptions;

CREATE POLICY "Users can view shared subscriptions they are partners in"
ON shared_subscriptions
FOR SELECT
USING (
  id IN (
    SELECT shared_subscription_id 
    FROM shared_subscription_partners 
    WHERE user_id = auth.uid()
  )
);