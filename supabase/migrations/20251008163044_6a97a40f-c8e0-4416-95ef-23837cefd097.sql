-- Fix infinite recursion in RLS policies for shared_subscription_partners
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view partners of their subscriptions" ON shared_subscription_partners;
DROP POLICY IF EXISTS "Partners can view their own partnership" ON shared_subscription_partners;
DROP POLICY IF EXISTS "Owners can manage partners" ON shared_subscription_partners;

-- Recreate policies without recursion
CREATE POLICY "Users can view partners of their subscriptions"
ON shared_subscription_partners
FOR SELECT
USING (
  shared_subscription_id IN (
    SELECT id FROM shared_subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners can view their own partnership"
ON shared_subscription_partners
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Owners can insert partners"
ON shared_subscription_partners
FOR INSERT
WITH CHECK (
  shared_subscription_id IN (
    SELECT id FROM shared_subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update partners"
ON shared_subscription_partners
FOR UPDATE
USING (
  shared_subscription_id IN (
    SELECT id FROM shared_subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete partners"
ON shared_subscription_partners
FOR DELETE
USING (
  shared_subscription_id IN (
    SELECT id FROM shared_subscriptions WHERE user_id = auth.uid()
  )
);