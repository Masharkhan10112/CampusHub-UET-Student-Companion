import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Profile = Tables<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Course = Tables<'courses'>
export type CourseInsert = TablesInsert<'courses'>
export type CourseUpdate = TablesUpdate<'courses'>

export type Assignment = Tables<'assignments'>
export type AssignmentInsert = TablesInsert<'assignments'>
export type AssignmentUpdate = TablesUpdate<'assignments'>

export type Task = Tables<'tasks'>
export type TaskInsert = TablesInsert<'tasks'>
export type TaskUpdate = TablesUpdate<'tasks'>

export type TimetableEntry = Tables<'timetable'>
export type TimetableInsert = TablesInsert<'timetable'>
export type TimetableUpdate = TablesUpdate<'timetable'>

export type Material = Tables<'materials'>
export type MaterialInsert = TablesInsert<'materials'>

export type Grade = Tables<'grades'>
export type GradeInsert = TablesInsert<'grades'>
export type GradeUpdate = TablesUpdate<'grades'>

export type StudySession = Tables<'study_sessions'>
export type StudySessionInsert = TablesInsert<'study_sessions'>

export type AiConversation = Tables<'ai_conversations'>
export type AiMessage = Tables<'ai_messages'>

export type StudyPlanRecord = Tables<'study_plans'>
export type QuizAttempt = Tables<'quiz_attempts'>
export type Notification = Tables<'notifications'>

export type Priority = Enums<'priority_level'>
export type AssignmentStatus = Enums<'assignment_status'>
export type TaskStatus = Enums<'task_status'>
export type TaskCategory = Enums<'task_category'>
export type NotificationType = Enums<'notification_type'>

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['pending', 'in_progress', 'completed']
export const TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed']
export const TASK_CATEGORIES: TaskCategory[] = [
  'study',
  'assignment',
  'personal',
  'exam',
  'project',
  'other',
]

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** Weekday order used by the timetable grid: Monday first, Sunday last. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export const COURSE_COLORS = [
  '#3366f2',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
] as const

export type AssignmentWithCourse = Assignment & {
  course: Pick<Course, 'id' | 'course_code' | 'course_name' | 'color'> | null
}
export type MaterialWithCourse = Material & {
  course: Pick<Course, 'id' | 'course_code' | 'course_name' | 'color'> | null
}
export type TimetableWithCourse = TimetableEntry & {
  course: Pick<Course, 'id' | 'course_code' | 'course_name' | 'color'> | null
}
export type GradeWithCourse = Grade & {
  course: Pick<Course, 'id' | 'course_code' | 'course_name'> | null
}
export type StudySessionWithCourse = StudySession & {
  course: Pick<Course, 'id' | 'course_code' | 'course_name'> | null
}
