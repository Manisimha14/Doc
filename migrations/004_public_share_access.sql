-- Migration: Public Share Access
-- Enables unauthenticated users to view documents in the global demo group

-- 1. Allow public (anon) access to documents in the global demo group
CREATE POLICY "Public Demo Documents Access"
ON public.documents FOR SELECT
TO anon
USING (
  group_id = '00000000-0000-0000-0000-000000000000'
);

-- 2. Allow public access to document groups (the global demo group itself)
CREATE POLICY "Public Demo Group Access"
ON public.document_groups FOR SELECT
TO anon
USING (
  id = '00000000-0000-0000-0000-000000000000'
);

-- 3. Note: Storage bucket 'family_vault' also needs a public read policy 
-- for the '00000000-0000-0000-0000-000000000000/' path if not using signed URLs.
-- However, we use signed URLs in the app, but those require service role key on server
-- or a valid session on client. 
-- For a truly public share page on other devices, we should use public URLs 
-- or a server-side proxy for signed URLs.
