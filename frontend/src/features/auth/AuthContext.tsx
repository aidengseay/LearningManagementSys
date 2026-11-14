import { useAppStore } from '../app/store'
export function useAuth() {
  const { user, login, register, logout, loading } = useAppStore()
  return { user, login, register, logout, loading }
}
