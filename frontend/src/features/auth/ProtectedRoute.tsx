import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'
import type { Role } from '../../api/types'
export default function ProtectedRoute({ role }: { role?: Role }) {
  const { user, loading } = useAuth()
  if (loading) return <p>Loading your account…</p>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'STUDENT' ? '/student' : '/instructor'} replace />
  return <Outlet />
}
