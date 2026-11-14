import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getAssignments, type Assignment } from '../../api/assignments'

export default function AssignmentList({ courseId, refreshKey = 0 }: { courseId: number; refreshKey?: number }) {
  const [items, setItems] = useState<Assignment[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getAssignments(courseId).then(data => { if (active) setItems(data) })
      .catch(err => { if (active) setError(String(err)) })
    return () => { active = false }
  }, [courseId, refreshKey])
  return <div className="stack">
    <h3>Assignments</h3>
    {error && <p role="alert" className="error">{error}</p>}
    {items.length === 0 && !error && <p className="muted">No assignments have been published yet.</p>}
    {items.map(a => <div className="quiz-row" key={a.id}>
      <div className="quiz-row-body"><strong>{a.title}</strong>
        <p className="muted">Due {new Date(a.dueAt).toLocaleString()} · {a.maxPoints} points</p>
        {a.submitted && <p>Submitted {a.graded ? '· Graded' : '· Awaiting grade'}</p>}
      </div>
      <Link className="quiz-take" to={`/assignments/${a.id}`}>View assignment</Link>
    </div>)}
  </div>
}
