import { useDemo } from '../demo/store'
export function useAuth() {
  const { user, login, logout, loading } = useDemo()
  return { user, login, logout, loading }
}
