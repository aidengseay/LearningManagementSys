import { useState, type FormEvent } from 'react'
import { useDemo } from '../demo/store'

export default function EnrollStudentForm({
  courseId
}: {
  courseId: number
}) {
  const { enrollStudent } = useDemo()

  const [email, setEmail] = useState('student@demo.test')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()

    setBusy(true)
    setError('')
    setSuccess('')

    try {
      await enrollStudent(courseId, email)
      setSuccess('Student enrolled successfully, or was already enrolled.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not enroll student.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel stack instructor-tool-form enroll-form" onSubmit={submit}>
      <div className="enroll-header">
        <div className="enroll-icon" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        </div>

        <div className="enroll-heading">
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">
            STUDENT MANAGEMENT
          </span>
          <h2>Enroll a student</h2>
          <p>Add a student to this course using their account email.</p>
        </div>
      </div>

      <div className="enroll-field">
        <label htmlFor="student-email">Student email address</label>

        <div className="enroll-row">
          <div className="enroll-input-wrap">
            <svg
              className="enroll-input-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>

            <input
              id="student-email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={event => {
                setEmail(event.target.value)
                setError('')
                setSuccess('')
              }}
              required
            />
          </div>

          <button type="submit" disabled={busy}>
            {busy ? 'Enrolling...' : 'Enroll student'}
          </button>
        </div>

        <span className="enroll-hint">
          The student must already have an account.
        </span>
      </div>

      {error && (
        <p role="alert" className="enroll-message enroll-message-error">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="enroll-message enroll-message-success">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {success}
        </p>
      )}
    </form>
  )
}