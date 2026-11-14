import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from './AuthContext'
import type { Role } from '../../api/types'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('STUDENT')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setBusy(true)
    try {
      const user = await register({ name, email, password, role })
      navigate(user.role === 'STUDENT' ? '/student' : '/instructor', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="login-page">
      <header className="login-header"><h1>2 ½ LMS</h1></header>
      <main className="login-background">
        <form className="login-card register-card stack" onSubmit={submit}>
          <h2>CREATE ACCOUNT</h2>
          <p className="login-description">Create your account to start learning or teaching.</p>
          <label>Full name<input placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
          <label>Email<input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Account type<select value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select></label>
          <label>Password<input type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required /></label>
          <label>Confirm password<input type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'CREATE ACCOUNT'}</button>
          <p className="login-switch">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </main>
    </div>
  )
}
