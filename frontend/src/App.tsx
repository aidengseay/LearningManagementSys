import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router'
import { AppProvider } from './features/app/store'
import { useAuth } from './features/auth/AuthContext'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import StudentDashboard from './features/dashboard/StudentDashboard'
import InstructorDashboard from './features/dashboard/InstructorDashboard'
import CoursePage from './features/courses/CoursePage'
import QuizPage from './features/quizzes/QuizPage'
import GradebookPage from './features/gradebook/GradebookPage'
import AssignmentPage from './features/assignments/AssignmentPage'
import './styles.css'
function Shell() {
  const { user, logout } = useAuth(); const navigate = useNavigate()
  return <><header className="topbar"><Link to={user?.role === 'STUDENT' ? '/student' : '/instructor'} className="brand">LMS</Link>
    <div className="actions"><span>{user?.name} · {user?.role.toLowerCase()}</span><button className="secondary" onClick={() => { logout(); navigate('/login') }}>Log out</button></div></header>
    <main className="container"><Outlet /></main></>
}
function Home() { const { user, loading } = useAuth(); if (loading) return <p>Loading your account…</p>; return <Navigate to={user ? user.role === 'STUDENT' ? '/student' : '/instructor' : '/login'} replace /> }
export default function App() {
  return <AppProvider><BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}><Route element={<Shell />}>
      <Route element={<ProtectedRoute role="STUDENT" />}><Route path="/student" element={<StudentDashboard />} /><Route path="/quizzes/:quizId" element={<QuizPage />} /></Route>
      <Route element={<ProtectedRoute role="INSTRUCTOR" />}><Route path="/instructor" element={<InstructorDashboard />} /></Route>
      <Route path="/courses/:courseId" element={<CoursePage />} />
      <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
      <Route path="/courses/:courseId/grades" element={<GradebookPage />} />
    </Route></Route>
    <Route path="*" element={<Home />} />
  </Routes></BrowserRouter></AppProvider>
}
