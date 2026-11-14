import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { getQuiz, getSubmission, submitQuizRequest } from '../../api/quizzes'
import type { QuizDetail, Submission } from '../../api/types'
import { useAppStore } from '../app/store'
import QuestionCard from './QuestionCard'

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

export default function QuizPage() {
  const { quizId } = useParams()
  const { user, courses } = useAppStore()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [previous, setPrevious] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const course = quiz && courses.find(c => c.id === quiz.courseId)

  useEffect(() => {
    let active = true
    const id = Number(quizId)
    if (!Number.isInteger(id)) {
      setLoading(false)
      return
    }
    Promise.all([getQuiz(id), getSubmission(id)])
      .then(([detail, submission]) => {
        if (active) {
          setQuiz(detail)
          setPrevious(submission)
        }
      })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load quiz') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [quizId])

  if (loading) return <p>Loading quiz…</p>

  if (!quiz || !course || user?.role !== 'STUDENT' || !course.studentIds.includes(user.id)) {
    return (
      <div className="take-page">
        <section className="take-unavailable">
          <h2>Quiz unavailable</h2>
          <p>{error || 'This quiz could not be found or you do not have access to it.'}</p>
          <Link to="/student" className="take-back">
            ← Back to dashboard
          </Link>
        </section>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const submission = await submitQuizRequest(quiz!.id, answers)
      setPrevious(submission)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  const total = quiz.questions.length
  const answered = Object.keys(answers).length
  const percent = previous?.total
    ? Math.round((previous.score / previous.total) * 100)
    : 0

  return (
    <div className="take-page">
      <Link to={`/courses/${quiz.courseId}`} className="take-back">
        ← Back to course
      </Link>

      <section className="take-header">
        <span className="dashboard-eyebrow dashboard-eyebrow-dark">
          {course.name}
        </span>
        <h1>{quiz.title}</h1>
        <div className="take-meta">
          <span>Due {formatDue(quiz.due)}</span>
          <span>
            {total} {total === 1 ? 'question' : 'questions'}
          </span>
        </div>
      </section>

      {previous ? (
        <section className="take-result">
          <div className="take-result-circle" aria-hidden="true">
            {percent}%
          </div>
          <div>
            <h2>Quiz submitted</h2>
            <p>
              You scored {previous.score} out of {previous.total}.
            </p>
            <Link to={`/courses/${quiz.courseId}`} className="take-result-link">
              Back to course
            </Link>
          </div>
        </section>
      ) : (
        <form className="take-form" onSubmit={submit}>
          {quiz.questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              number={index + 1}
              question={q}
              selected={answers[q.id]}
              onChange={value => setAnswers(a => ({ ...a, [q.id]: value }))}
            />
          ))}

          {error && (
            <p role="alert" className="take-error">
              {error}
            </p>
          )}

          <div className="take-footer">
            <div className="take-progress">
              <span>
                {answered} of {total} answered
              </span>
              <div className="take-progress-bar" aria-hidden="true">
                <div
                  className="take-progress-fill"
                  style={{ width: total ? `${(answered / total) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <button type="submit" disabled={answered !== total || busy}>
              {busy ? 'Submitting...' : 'Submit quiz'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
