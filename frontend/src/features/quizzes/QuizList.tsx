import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getQuizzes } from '../../api/quizzes'
import type { QuizListItem } from '../../api/types'
import { useAuth } from '../auth/AuthContext'

function formatDue(due: string) {
  const date = new Date(`${due}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? due
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
}

export default function QuizList({ courseId, refreshKey = 0 }: { courseId: number; refreshKey?: number }) {
  const { user } = useAuth()
  const [courseQuizzes, setCourseQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getQuizzes(courseId)
      .then(items => { if (active) setCourseQuizzes(items) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load quizzes') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, refreshKey])

  if (loading) return <p className="muted">Loading quizzes…</p>
  if (error) return <p role="alert" className="error">{error}</p>

  if (courseQuizzes.length === 0) {
    return (
      <div className="quiz-empty">
        <h3>No quizzes yet</h3>
        <p>
          {user?.role === 'INSTRUCTOR'
            ? 'Use the tools above to create the first quiz for this course.'
            : 'Quizzes your instructor publishes will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="quiz-list">
      {courseQuizzes.map(q => {
        const done = q.submitted
        const count = q.questionCount

        return (
          <div className="quiz-row" key={q.id}>
            <div className="quiz-row-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </div>

            <div className="quiz-row-body">
              <strong className="quiz-row-title">{q.title}</strong>
              <div className="quiz-row-meta">Due {formatDue(q.due)}</div>
            </div>

            {done ? (
              <span className="quiz-score">
                <strong>
                  {q.score}/{q.total}
                </strong>
                <span>
                  {q.total
                    ? Math.round(((q.score ?? 0) / q.total) * 100)
                    : 0}
                  %
                </span>
              </span>
            ) : user?.role === 'STUDENT' ? (
              <Link to={`/quizzes/${q.id}`} className="quiz-take">
                Take quiz
              </Link>
            ) : (
              <span className="quiz-pill">
                {count} {count === 1 ? 'question' : 'questions'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
