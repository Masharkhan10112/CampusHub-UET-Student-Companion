-- Derives notifications for the calling user from their own assignments and
-- tasks. The client calls `select public.sync_notifications()` when the app
-- loads; the unique (user_id, type, reference_id) index keeps it idempotent so
-- the same deadline never produces a duplicate notification.

create or replace function public.sync_notifications()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  created integer := 0;
  inserted integer;
begin
  if uid is null then
    raise exception 'sync_notifications requires an authenticated user';
  end if;

  -- Assignments due within the next 24 hours.
  insert into public.notifications (user_id, title, message, type, reference_id)
  select
    uid,
    'Assignment due soon',
    a.title || ' is due ' || to_char(a.due_date at time zone 'UTC', 'Mon DD at HH24:MI') || ' UTC.',
    'assignment_due',
    a.id
  from public.assignments a
  where a.user_id = uid
    and a.status <> 'completed'
    and a.due_date between now() and now() + interval '24 hours'
  on conflict (user_id, type, reference_id) do nothing;
  get diagnostics inserted = row_count;
  created := created + inserted;

  -- Overdue assignments.
  insert into public.notifications (user_id, title, message, type, reference_id)
  select
    uid,
    'Assignment overdue',
    a.title || ' was due ' || to_char(a.due_date at time zone 'UTC', 'Mon DD at HH24:MI') || ' UTC.',
    'assignment_overdue',
    a.id
  from public.assignments a
  where a.user_id = uid
    and a.status <> 'completed'
    and a.due_date < now()
  on conflict (user_id, type, reference_id) do nothing;
  get diagnostics inserted = row_count;
  created := created + inserted;

  -- Tasks due today.
  insert into public.notifications (user_id, title, message, type, reference_id)
  select
    uid,
    'Task due today',
    t.title || ' is on today''s list.',
    'task_due',
    t.id
  from public.tasks t
  where t.user_id = uid
    and t.status <> 'completed'
    and t.due_date is not null
    and t.due_date::date = (now() at time zone 'UTC')::date
  on conflict (user_id, type, reference_id) do nothing;
  get diagnostics inserted = row_count;
  created := created + inserted;

  -- Upcoming exam tasks within the next 7 days.
  insert into public.notifications (user_id, title, message, type, reference_id)
  select
    uid,
    'Upcoming exam',
    t.title || ' is coming up on ' || to_char(t.due_date at time zone 'UTC', 'Mon DD') || '.',
    'exam',
    t.id
  from public.tasks t
  where t.user_id = uid
    and t.category = 'exam'
    and t.status <> 'completed'
    and t.due_date between now() and now() + interval '7 days'
  on conflict (user_id, type, reference_id) do nothing;
  get diagnostics inserted = row_count;
  created := created + inserted;

  return created;
end;
$$;

grant execute on function public.sync_notifications() to authenticated;
