import { useEffect, useState } from 'react'
import { getCourseStudentsRequest, getJoinCodeRequest } from '../../api/courses'
import type { User } from '../../api/types'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export default function InstructorCourseTools({ courseId }: { courseId: number }) {
  const [code, setCode] = useState('')
  const [students, setStudents] = useState<User[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getJoinCodeRequest(courseId), getCourseStudentsRequest(courseId)])
      .then(([join, roster]) => { if (active) { setCode(join.code); setStudents(roster) } })
      .catch((err: Error) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable: the code is still visible to copy by hand */
    }
  }

  return (
    <section className="course-content-section panel enr-section">
      <div className="course-section-heading">
        <div>
          <p className="course-eyebrow">COURSE ACCESS</p>
          <h2>Student enrollment</h2>
          <p>Share the course code and review the current roster.</p>
        </div>
      </div>

      {error && <p className="enr-error" role="alert">{error}</p>}

      {code && (
        <div className="enr-code-card">
          <div className="enr-code-info">
            <span className="enr-code-label">Enrollment code</span>
            <strong className="enr-code">{code}</strong>
            <span className="enr-code-hint">Share this code with students so they can join the course.</span>
          </div>

          <button
            type="button"
            className={`enr-copy${copied ? ' copied' : ''}`}
            onClick={copyCode}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy code
              </>
            )}
          </button>
        </div>
      )}

      <div className="enr-roster">
        <div className="enr-roster-head">
          <h3>Enrolled students</h3>
          <span className="enr-count">{students.length}</span>
        </div>

        {loading ? (
          <p className="enr-empty">Loading roster...</p>
        ) : students.length === 0 ? (
          <div className="enr-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <strong>No students enrolled yet</strong>
            <span>Students who join with your code will appear here.</span>
          </div>
        ) : (
          <ul className="enr-list">
            {students.map(s => (
              <li key={s.id} className="enr-student">
                <span className={`enr-avatar av-${s.id % 5}`} aria-hidden="true">
                  {initials(s.name)}
                </span>
                <span className="enr-student-text">
                  <strong>{s.name}</strong>
                  <small>{s.email}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}