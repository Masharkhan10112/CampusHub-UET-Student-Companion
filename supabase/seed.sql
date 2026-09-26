-- Local development seed data.
-- Creates one demo student (demo@campushub.test / campushub-2026) with a
-- realistic semester of courses, assignments, tasks, timetable and grades.
-- Never run this against a hosted project.

do $$
declare
  demo_user uuid := '11111111-1111-4111-8111-111111111111';
  course_ds uuid := '22222222-2222-4222-8222-222222222201';
  course_db uuid := '22222222-2222-4222-8222-222222222202';
  course_os uuid := '22222222-2222-4222-8222-222222222203';
  course_nw uuid := '22222222-2222-4222-8222-222222222204';
begin
  if exists (select 1 from auth.users where id = demo_user) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    demo_user,
    'authenticated',
    'authenticated',
    'demo@campushub.test',
    crypt('campushub-2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', 'Ayesha Khan',
      'university', 'UET Lahore',
      'department', 'Computer Science',
      'semester', '5'
    ),
    now(),
    now()
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(),
    demo_user,
    demo_user::text,
    jsonb_build_object('sub', demo_user::text, 'email', 'demo@campushub.test', 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  );

  insert into public.courses (id, user_id, course_code, course_name, instructor, credit_hours, semester, color)
  values
    (course_ds, demo_user, 'CS-301', 'Data Structures & Algorithms', 'Dr. Imran Ali', 4, 5, '#2563eb'),
    (course_db, demo_user, 'CS-311', 'Database Systems', 'Dr. Sana Malik', 3, 5, '#16a34a'),
    (course_os, demo_user, 'CS-321', 'Operating Systems', 'Dr. Usman Tariq', 3, 5, '#f59e0b'),
    (course_nw, demo_user, 'CS-331', 'Computer Networks', 'Dr. Hira Shah', 3, 5, '#db2777');

  insert into public.assignments (user_id, course_id, title, description, due_date, priority, status, completion_percentage)
  values
    (demo_user, course_ds, 'AVL tree implementation', 'Implement insert, delete and rotations with unit tests.', now() + interval '2 days', 'high', 'in_progress', 40),
    (demo_user, course_ds, 'Graph traversal report', 'Compare BFS and DFS on the provided dataset.', now() + interval '9 days', 'medium', 'pending', 0),
    (demo_user, course_db, 'Normalisation worksheet', 'Normalise the university schema up to BCNF.', now() - interval '1 day', 'urgent', 'pending', 20),
    (demo_user, course_db, 'ER diagram submission', 'Library management system ER diagram.', now() - interval '6 days', 'medium', 'completed', 100),
    (demo_user, course_os, 'Scheduling simulation', 'Simulate SJF and round robin scheduling.', now() + interval '5 days', 'high', 'pending', 0),
    (demo_user, course_nw, 'Socket programming lab', 'Build a small TCP chat client and server.', now() + interval '12 days', 'low', 'pending', 0);

  insert into public.tasks (user_id, title, description, due_date, priority, status, category)
  values
    (demo_user, 'Revise sorting algorithms', 'Merge, quick and heap sort complexity.', now() + interval '6 hours', 'high', 'pending', 'study'),
    (demo_user, 'Print database lab manual', null, now() + interval '1 day', 'low', 'pending', 'personal'),
    (demo_user, 'Group meeting for OS project', 'Divide modules between team members.', now() + interval '3 days', 'medium', 'pending', 'project'),
    (demo_user, 'Past papers - Networks midterm', 'Solve the last three years of papers.', now() + interval '8 days', 'urgent', 'pending', 'exam'),
    (demo_user, 'Submit hostel form', null, now() - interval '2 days', 'medium', 'completed', 'personal');

  insert into public.timetable (user_id, course_id, day_of_week, start_time, end_time, room)
  values
    (demo_user, course_ds, 1, '08:30', '10:00', 'Lecture Hall 3'),
    (demo_user, course_db, 1, '10:15', '11:45', 'Lecture Hall 1'),
    (demo_user, course_os, 2, '09:00', '10:30', 'Block C-204'),
    (demo_user, course_nw, 2, '11:00', '12:30', 'Block C-110'),
    (demo_user, course_ds, 3, '08:30', '10:00', 'Lecture Hall 3'),
    (demo_user, course_db, 4, '13:00', '16:00', 'Database Lab'),
    (demo_user, course_nw, 5, '09:00', '12:00', 'Networks Lab');

  insert into public.grades (user_id, course_id, course_label, semester, credit_hours, grade, grade_points)
  values
    (demo_user, null, 'Programming Fundamentals', 1, 4, 'A', 4.0),
    (demo_user, null, 'Applied Physics', 1, 3, 'B+', 3.3),
    (demo_user, null, 'Calculus I', 1, 3, 'B', 3.0),
    (demo_user, null, 'Object Oriented Programming', 2, 4, 'A', 4.0),
    (demo_user, null, 'Discrete Mathematics', 2, 3, 'A-', 3.7),
    (demo_user, null, 'Digital Logic Design', 3, 3, 'B+', 3.3),
    (demo_user, null, 'Linear Algebra', 3, 3, 'A', 4.0),
    (demo_user, null, 'Software Engineering', 4, 3, 'A-', 3.7),
    (demo_user, null, 'Theory of Automata', 4, 3, 'B', 3.0);

  insert into public.study_sessions (user_id, course_id, start_time, end_time, duration_minutes, notes)
  select
    demo_user,
    course_id,
    now() - (offset_days || ' days')::interval,
    now() - (offset_days || ' days')::interval + (minutes || ' minutes')::interval,
    minutes,
    note
  from (
    values
      (course_ds, 1, 90, 'Rotations practice'),
      (course_db, 2, 60, 'Normalisation examples'),
      (course_os, 3, 120, 'Scheduling algorithms'),
      (course_ds, 4, 45, 'Heap sort revision'),
      (course_nw, 5, 75, 'TCP handshake'),
      (course_db, 7, 90, 'Indexing and query plans'),
      (course_os, 9, 60, 'Deadlock conditions'),
      (course_ds, 11, 105, 'Dynamic programming')
  ) as s(course_id, offset_days, minutes, note);

  insert into public.notifications (user_id, type, title, message)
  values
    (demo_user, 'assignment_overdue', 'Normalisation worksheet is overdue', 'It was due yesterday for CS-311.'),
    (demo_user, 'study_reminder', 'Time to revise', 'You planned 90 minutes of Data Structures today.');
end
$$;
