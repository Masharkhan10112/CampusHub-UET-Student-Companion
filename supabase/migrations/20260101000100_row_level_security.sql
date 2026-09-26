-- CampusHub Row Level Security
-- Every table in this schema is user-owned: a row is only ever visible to the
-- auth user whose id is stored in user_id (or, for profiles, in id).
-- The client never sends a user id; policies derive it from the JWT.

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.timetable enable row level security;
alter table public.materials enable row level security;
alter table public.grades enable row level security;
alter table public.study_sessions enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.study_plans enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.notifications enable row level security;

-- profiles ------------------------------------------------------------------
create policy "Profiles are viewable by their owner"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by their owner"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Profiles are updatable by their owner"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Profiles are deletable by their owner"
  on public.profiles for delete to authenticated
  using (auth.uid() = id);

-- Generic owner policies for the remaining tables. Every one of them stores the
-- owner in user_id, so the policy bodies are identical; they are generated here
-- to keep them provably consistent.
do $$
declare
  t text;
begin
  foreach t in array array[
    'courses', 'assignments', 'tasks', 'timetable', 'materials', 'grades',
    'study_sessions', 'ai_conversations', 'ai_messages', 'study_plans',
    'quiz_attempts', 'notifications'
  ]
  loop
    execute format(
      'create policy "Owners can read their %1$s" on public.%1$I
         for select to authenticated using (auth.uid() = user_id)', t);
    execute format(
      'create policy "Owners can insert their %1$s" on public.%1$I
         for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "Owners can update their %1$s" on public.%1$I
         for update to authenticated using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "Owners can delete their %1$s" on public.%1$I
         for delete to authenticated using (auth.uid() = user_id)', t);
  end loop;
end;
$$;

-- An ai_message must additionally belong to a conversation the caller owns, so a
-- user cannot append messages into somebody else's thread by guessing its id.
create policy "AI messages must belong to an owned conversation"
  on public.ai_messages as restrictive for all to authenticated
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- Rows referencing a course must reference a course the caller owns.
do $$
declare
  t text;
begin
  foreach t in array array['assignments', 'timetable', 'materials', 'grades', 'study_sessions']
  loop
    execute format(
      'create policy "%1$s must reference an owned course" on public.%1$I
         as restrictive for all to authenticated
         using (
           course_id is null or exists (
             select 1 from public.courses c where c.id = %1$I.course_id and c.user_id = auth.uid()
           )
         )
         with check (
           course_id is null or exists (
             select 1 from public.courses c where c.id = %1$I.course_id and c.user_id = auth.uid()
           )
         )', t);
  end loop;
end;
$$;
