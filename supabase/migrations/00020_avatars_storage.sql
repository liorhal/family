-- Avatar photo upload storage bucket
-- Run in Supabase SQL Editor if using deploy-all, or apply via supabase db push

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: authenticated family members can upload/update/delete avatars in their family folder
CREATE POLICY "Family members can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = get_my_family_id()::text
);

CREATE POLICY "Family members can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = get_my_family_id()::text
);

CREATE POLICY "Family members can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = get_my_family_id()::text
);

-- Public read: bucket is public, no SELECT policy needed for public access
