
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
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const user = await login(email, password)
      navigate(user.role === 'STUDENT' ? '/student' : '/instructor', {
        replace: true
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">

      <header className="login-header">
        <h1>2 ½ LMS</h1>
      </header>

      <main className="login-background">
        <form className="login-card stack" onSubmit={submit}>

          <h2>LOG IN</h2>

          <p className="login-description">
            Welcome! Please enter your credentials to continue.
          </p>

          <label>
            Email
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}

          <button disabled={busy} type="submit">
            {busy ? 'Logging in...' : 'LOG IN'}
          </button>

          <div className="login-demo">
            <p>Demo Account Information</p>
            <small>
              Student: student@demo.test
            </small>
            <small>
              Instructor: instructor@demo.test
            </small>
            <small>
              Passwords are set in your local .env file.
            </small>
          </div>

        </form>
      </main>

    </div>
  )
}
