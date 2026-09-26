import { Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AiTutorPage } from '@/pages/AiTutorPage'
import { AssignmentsPage } from '@/pages/AssignmentsPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { GpaPage } from '@/pages/GpaPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MaterialsPage } from '@/pages/MaterialsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { QuizPage } from '@/pages/QuizPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StudyPlanPage } from '@/pages/StudyPlanPage'
import { SummarizerPage } from '@/pages/SummarizerPage'
import { TasksPage } from '@/pages/TasksPage'
import { TimetablePage } from '@/pages/TimetablePage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicOnlyRoute } from '@/routes/PublicOnlyRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/gpa" element={<GpaPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
          <Route path="/study-plan" element={<StudyPlanPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/summarizer" element={<SummarizerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
