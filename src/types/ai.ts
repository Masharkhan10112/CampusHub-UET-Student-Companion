export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export type QuizQuestion = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type StudyPlanBlock = {
  subject: string
  topic: string
  durationMinutes: number
  type: 'study' | 'revision' | 'practice' | 'break'
}

export type StudyPlanDay = {
  day: string
  date?: string
  blocks: StudyPlanBlock[]
}

export type StudyPlan = {
  title: string
  summary: string
  days: StudyPlanDay[]
}

export type NotesSummary = {
  summary: string
  keyPoints: string[]
  definitions: { term: string; meaning: string }[]
  formulas: string[]
  examQuestions: string[]
}
