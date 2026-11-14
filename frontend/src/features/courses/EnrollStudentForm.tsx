import { useState, type FormEvent } from 'react'
import { useDemo } from '../demo/store'
export default function EnrollStudentForm({ courseId }: { courseId: number }) {
  const { enrollStudent } = useDemo()
  const [email, setEmail] = useState('student@demo.test')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try { await enrollStudent(courseId, email); setSuccess('Student enrolled (or already enrolled).') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not enroll student') }
    finally { setBusy(false) }
  }
  return <form className="panel stack" onSubmit={submit}><h2>Enroll student</h2>
    <input type="email" aria-label="Student email" value={email} onChange={e => setEmail(e.target.value)} required />
    {error && <p role="alert" className="error">{error}</p>}{success && <p>{success}</p>}
    <button type="submit" disabled={busy}>Enroll</button>
  </form>
}
