-- Add SELECT policy to restrict viewing support contacts to support staff and admins only
CREATE POLICY "Support staff can view all support contacts"
ON public.support_contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin')
);

-- Add UPDATE policy so support staff can manage contact status
CREATE POLICY "Support staff can update support contacts"
ON public.support_contacts
FOR UPDATE
USING (
  has_role(auth.uid(), 'support') OR has_role(auth.uid(), 'admin')
);

-- Add DELETE policy for admins to remove spam/test entries
CREATE POLICY "Admins can delete support contacts"
ON public.support_contacts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);