import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getAssignments, type Assignment } from '../../api/assignments'
import { formatDateTime } from './format'

export default function AssignmentList({ courseId, refreshKey = 0 }: { courseId: number; refreshKey?: number }) {
  const [items, setItems] = useState<Assignment[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getAssignments(courseId).then(data => { if (active) setItems(data) })
      .catch(err => { if (active) setError(String(err)) })
    return () => { active = false }
  }, [courseId, refreshKey])

  return (
    <div className="asn-list">
      <h3 className="asn-subhead">Assignments</h3>

      {error && <p role="alert" className="asn-error">{error}</p>}

      {items.length === 0 && !error && (
        <div className="quiz-empty">
          <h3>No assignments yet</h3>
          <p>No assignments have been published yet.</p>
        </div>
      )}

      {items.map(a => (
        <div className="quiz-row" key={a.id}>
          <div className="quiz-row-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          </div>

          <div className="quiz-row-body">
            <strong className="quiz-row-title">{a.title}</strong>
            <div className="quiz-row-meta">
              Due {formatDateTime(a.dueAt)} · {a.maxPoints} points
            </div>
            {a.submitted && (
              <div className="asn-row-chips">
                {a.graded
                  ? <span className="asn-chip good">Graded</span>
                  : <span className="asn-chip info">Submitted · Awaiting grade</span>}
              </div>
            )}
          </div>

          <Link className="quiz-take" to={`/assignments/${a.id}`}>View assignment</Link>
        </div>
      ))}
    </div>
  )
}