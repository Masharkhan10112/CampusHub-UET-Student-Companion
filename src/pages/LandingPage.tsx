import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Calculator,
  CheckCircle2,
  FolderOpen,
  GraduationCap,
  ListChecks,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Course management',
    description: 'Keep every course, instructor and credit hour in one organised place.',
  },
  {
    icon: ListChecks,
    title: 'Assignments and deadlines',
    description: 'Track progress, priorities and overdue work before it becomes a problem.',
  },
  {
    icon: CalendarDays,
    title: 'Weekly timetable',
    description: 'See today at a glance and plan the rest of the week around your classes.',
  },
  {
    icon: FolderOpen,
    title: 'Study materials',
    description: 'Upload slides, PDFs and notes, and find them again by course in seconds.',
  },
  {
    icon: Calculator,
    title: 'GPA calculator',
    description: 'Semester and cumulative GPA with quality points, saved to your record.',
  },
  {
    icon: BarChart3,
    title: 'Academic progress',
    description: 'GPA trend, study hours and completion charts built from your real data.',
  },
]

const STEPS = [
  {
    title: 'Create your account',
    description:
      'Add your university, department and semester so the dashboard fits your programme.',
  },
  {
    title: 'Add courses and deadlines',
    description: 'Bring in your timetable, assignments and personal tasks for the semester.',
  },
  {
    title: 'Study with a plan',
    description:
      'Let the AI assistant explain topics, build study plans and quiz you before exams.',
  },
]

const AI_CAPABILITIES = [
  'Explain any topic at a beginner or advanced level',
  'Generate practice MCQs with explanations',
  'Summarise your notes into key points and definitions',
  'Build a day-by-day revision plan around your exam date',
]

const PRODUCTIVITY = [
  { icon: Bell, label: 'Deadline notifications' },
  { icon: NotebookPen, label: 'Saved study plans' },
  { icon: CheckCircle2, label: 'Task filters and categories' },
  { icon: Sparkles, label: 'Global search across everything' },
]

export function LandingPage() {
  const { session } = useAuth()
  const primaryHref = session ? '/dashboard' : '/register'

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-brand-600 p-1.5 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">CampusHub</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              to={primaryHref}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Built for university students
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Your University Life, Organized.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
                Manage courses, assignments, deadlines, study materials, GPA, and your study plan
                from one intelligent student dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={primaryHref}
                  className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Courses', value: '6' },
                  { label: 'Pending work', value: '4' },
                  { label: 'Tasks done', value: '18' },
                  { label: 'Current GPA', value: '3.62' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-medium">Upcoming deadlines</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {[
                    { color: 'bg-red-600', text: 'BST assignment - due today' },
                    { color: 'bg-orange-500', text: 'OS scheduling report - 2 days' },
                    { color: 'bg-amber-500', text: 'Web project milestone - 5 days' },
                  ].map((row) => (
                    <li
                      key={row.text}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <span className={`h-2 w-2 rounded-full ${row.color}`} aria-hidden="true" />
                      {row.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                  Illustrative preview of the dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything a semester needs
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              One workspace for the coursework, deadlines and revision that used to live across five
              different apps.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="inline-flex rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* AI assistant */}
        <section className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <span className="inline-flex rounded-lg bg-brand-600 p-2 text-white">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                An AI study assistant that knows how students revise
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Ask questions in plain language and get explanations written at a student level. AI
                requests run through a secure server-side function, so no API key ever reaches your
                browser.
              </p>
              <ul className="mt-6 space-y-2">
                {AI_CAPABILITIES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="space-y-3 text-sm">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-white">
                  Explain deadlock in operating systems.
                </p>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <p>
                    A deadlock happens when processes each hold a resource the other needs, so none
                    can continue. It requires four conditions at once: mutual exclusion, hold and
                    wait, no preemption, and circular wait.
                  </p>
                </div>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-white">
                  Generate 10 MCQs about networking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Productivity */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Productivity built in
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTIVITY.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <item.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl bg-brand-600 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Start your most organised semester
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-100">
              Free to set up. Bring your courses, deadlines and notes into one dashboard today.
            </p>
            <Link
              to={primaryHref}
              className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
          <p>CampusHub - University Student Companion</p>
          <nav className="flex gap-4" aria-label="Footer">
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-100">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-slate-100">
              Register
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
