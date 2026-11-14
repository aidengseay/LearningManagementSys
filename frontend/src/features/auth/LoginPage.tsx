import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('student@demo.test')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const user = await login(email, password)
      navigate(user.role === 'STUDENT' ? '/student' : '/instructor', { replace: true })
    } catch (err) { setError(err instanceof Error ? err.message : 'Login failed') }
    finally { setBusy(false) }
  }
  return <form className="panel login stack" onSubmit={submit}>
    <h1>Learning Management System</h1>
    <p>Log in with your seeded student or instructor account.</p>
    <label>Email <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button disabled={busy} type="submit">{busy ? 'Logging in…' : 'Log in'}</button>
    <small>Demo emails: student@demo.test and instructor@demo.test. Passwords are set in your local .env.</small>
  </form>
}
