import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router'
import { DemoProvider } from './features/demo/store'
import { useAuth } from './features/auth/AuthContext'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import StudentDashboard from './features/dashboard/StudentDashboard'
import InstructorDashboard from './features/dashboard/InstructorDashboard'
import CoursePage from './features/courses/CoursePage'
import QuizPage from './features/quizzes/QuizPage'
import GradebookPage from './features/gradebook/GradebookPage'
import './styles.css'

function Shell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="topbar">
        <Link
          to={user?.role === 'STUDENT' ? '/student' : '/instructor'}
          className="brand"
        >
          2 ½ LMS
        </Link>

        <div className="actions">
          <span>
            {user?.name} · {user?.role === 'STUDENT' ? 'Student' : 'Instructor'}
          </span>

          <button
            className="secondary"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

function Home() { const { user, loading } = useAuth(); if (loading) return <p>Loading your account…</p>; return <Navigate to={user ? user.role === 'STUDENT' ? '/student' : '/instructor' : '/login'} replace /> }
export default function App() {
  return <DemoProvider><BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}><Route element={<Shell />}>
      <Route element={<ProtectedRoute role="STUDENT" />}><Route path="/student" element={<StudentDashboard />} /><Route path="/quizzes/:quizId" element={<QuizPage />} /></Route>
      <Route element={<ProtectedRoute role="INSTRUCTOR" />}><Route path="/instructor" element={<InstructorDashboard />} /></Route>
      <Route path="/courses/:courseId" element={<CoursePage />} />
      <Route path="/courses/:courseId/grades" element={<GradebookPage />} />
    </Route></Route>
    <Route path="*" element={<Home />} />
  </Routes></BrowserRouter></DemoProvider>
}
