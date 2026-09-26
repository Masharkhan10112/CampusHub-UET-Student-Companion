import {
  BookOpen,
  Bot,
  CalendarDays,
  Calculator,
  CheckSquare,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Courses', to: '/courses', icon: BookOpen },
      { label: 'Assignments', to: '/assignments', icon: ListChecks },
      { label: 'Tasks', to: '/tasks', icon: CheckSquare },
      { label: 'Timetable', to: '/timetable', icon: CalendarDays },
      { label: 'Materials', to: '/materials', icon: FolderOpen },
    ],
  },
  {
    label: 'Performance',
    items: [
      { label: 'GPA', to: '/gpa', icon: Calculator },
      { label: 'Progress', to: '/progress', icon: TrendingUp },
    ],
  },
  {
    label: 'AI Assistant',
    items: [
      { label: 'AI Tutor', to: '/ai-tutor', icon: Bot },
      { label: 'Study Plan', to: '/study-plan', icon: NotebookPen },
      { label: 'Quiz Generator', to: '/quiz', icon: FileText },
      { label: 'Notes Summarizer', to: '/summarizer', icon: FileText },
    ],
  },
]

/** Bottom bar on phones -- the five destinations students open most. */
export const MOBILE_NAV: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Courses', to: '/courses', icon: BookOpen },
  { label: 'Work', to: '/assignments', icon: ListChecks },
  { label: 'Timetable', to: '/timetable', icon: CalendarDays },
  { label: 'AI', to: '/ai-tutor', icon: Bot },
]
