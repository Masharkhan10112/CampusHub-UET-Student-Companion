-- CampusHub initial schema
-- Creates every user-owned table, the enums they depend on, indexes for the
-- columns the application filters on, and the updated_at trigger.
-- Row Level Security lives in 20260101000100_row_level_security.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');
create type public.assignment_status as enum ('pending', 'in_progress', 'completed');
create type public.task_status as enum ('pending', 'in_progress', 'completed');
create type public.task_category as enum ('study', 'assignment', 'personal', 'exam', 'project', 'other');
create type public.ai_role as enum ('user', 'assistant');
create type public.notification_type as enum ('info', 'assignment_due', 'assignment_overdue', 'task_due', 'exam', 'study_reminder');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  university text,
  department text,
  semester integer check (semester is null or (semester between 1 and 16)),
  profile_image_url text,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  notification_preferences jsonb not null default
    '{"assignment_reminders": true, "task_reminders": true, "study_reminders": true}'::jsonb,
  ai_preferences jsonb not null default
    '{"detail_level": "balanced", "tone": "friendly"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row whenever Supabase Auth creates a user. The registration
-- form passes full_name / university / department / semester through the signup
-- metadata so the profile is complete from the first login.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, university, department, semester)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'university', ''),
    nullif(new.raw_user_meta_data ->> 'department', ''),
    nullif(new.raw_user_meta_data ->> 'semester', '')::integer
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_code text not null,
  course_name text not null,
  instructor text,
  credit_hours numeric(4, 2) not null default 3 check (credit_hours >= 0 and credit_hours <= 30),
  semester integer check (semester is null or (semester between 1 and 16)),
  color text not null default '#3366f2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_user_id_idx on public.courses (user_id);
create index courses_user_created_idx on public.courses (user_id, created_at desc);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- assignments
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz not null,
  priority public.priority_level not null default 'medium',
  status public.assignment_status not null default 'pending',
  completion_percentage integer not null default 0
    check (completion_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assignments_user_id_idx on public.assignments (user_id);
create index assignments_course_id_idx on public.assignments (course_id);
create index assignments_user_due_date_idx on public.assignments (user_id, due_date);
create index assignments_user_status_idx on public.assignments (user_id, status);

create trigger assignments_set_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  priority public.priority_level not null default 'medium',
  status public.task_status not null default 'pending',
  category public.task_category not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index tasks_user_status_idx on public.tasks (user_id, status);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- timetable
-- ---------------------------------------------------------------------------
create table public.timetable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_time_order check (end_time > start_time)
);

create index timetable_user_id_idx on public.timetable (user_id);
create index timetable_user_day_idx on public.timetable (user_id, day_of_week, start_time);

create trigger timetable_set_updated_at
  before update on public.timetable
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  description text,
  file_name text not null,
  file_path text not null unique,
  file_type text,
  file_size bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materials_user_id_idx on public.materials (user_id);
create index materials_course_id_idx on public.materials (course_id);
create index materials_user_created_idx on public.materials (user_id, created_at desc);

create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- grades
-- ---------------------------------------------------------------------------
create table public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  course_label text,
  grade text not null,
  grade_points numeric(4, 2) not null check (grade_points >= 0 and grade_points <= 5),
  credit_hours numeric(4, 2) not null check (credit_hours > 0 and credit_hours <= 30),
  semester integer not null check (semester between 1 and 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grades_user_id_idx on public.grades (user_id);
create index grades_user_semester_idx on public.grades (user_id, semester);

create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- study_sessions
-- ---------------------------------------------------------------------------
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now(),
  constraint study_sessions_time_order check (end_time > start_time)
);

create index study_sessions_user_id_idx on public.study_sessions (user_id);
create index study_sessions_user_start_idx on public.study_sessions (user_id, start_time desc);

-- ---------------------------------------------------------------------------
-- AI conversations / messages
-- ---------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_updated_idx on public.ai_conversations (user_id, updated_at desc);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.ai_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_id_idx on public.ai_messages (user_id);

-- ---------------------------------------------------------------------------
-- study_plans (saved output of the AI study plan generator)
-- ---------------------------------------------------------------------------
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  subject text,
  exam_date date,
  hours_per_day numeric(4, 2),
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index study_plans_user_created_idx on public.study_plans (user_id, created_at desc);

create trigger study_plans_set_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quiz_attempts (saved results of the AI quiz generator)
-- ---------------------------------------------------------------------------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  questions jsonb not null,
  answers jsonb,
  score integer,
  total_questions integer not null,
  created_at timestamptz not null default now()
);

create index quiz_attempts_user_created_idx on public.quiz_attempts (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'info',
  is_read boolean not null default false,
  reference_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, type, reference_id)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where is_read = false;
