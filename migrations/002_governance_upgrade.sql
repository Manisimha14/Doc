-- UPGRADE: Zero-Trust Governance & Audit Timeline
-- Run this in your Supabase SQL Editor

-- 1. Add Status to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected'));

-- 2. Create Audit Logs for the Timeline
CREATE TABLE IF NOT EXISTS public.vault_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.document_groups(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'join_request', 'approved', 'rejected', 'document_upload', 'document_view'
  description text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Update existing admin to active
UPDATE public.profiles SET status = 'active' WHERE role = 'Admin';

-- 4. Enable RLS on Audit Logs
ALTER TABLE public.vault_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Only family members can see logs
CREATE POLICY "Family Logs Access"
ON public.vault_audit_logs FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
  )
);
