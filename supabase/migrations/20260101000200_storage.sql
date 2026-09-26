-- CampusHub storage buckets
--   study-materials : private, files live under <auth.uid()>/<uuid>.<ext>
--   avatars         : public read (profile pictures), writes restricted to owner
-- Both buckets derive ownership from the first path segment, which the client
-- always sets to the authenticated user id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  false,
  52428800, -- 50 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/zip'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Users can read their own study materials"
  on storage.objects for select to authenticated
  using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own study materials"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own study materials"
  on storage.objects for update to authenticated
  using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own study materials"
  on storage.objects for delete to authenticated
  using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatars are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
