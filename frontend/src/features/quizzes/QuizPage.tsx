import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useDemo } from '../demo/store'
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
  const { user, quizzes, courses, submissions, submitQuiz } = useDemo()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState('')

  const quiz = quizzes.find(q => q.id === Number(quizId))
  const course = quiz && courses.find(c => c.id === quiz.courseId)
  const previous = submissions.find(
    s => s.quizId === quiz?.id && s.studentId === user?.id
  )

  if (!quiz || !course || user?.role !== 'STUDENT' || !course.studentIds.includes(user.id)) {
    return (
      <div className="take-page">
        <section className="take-unavailable">
          <h2>Quiz unavailable</h2>
          <p>This quiz could not be found or you do not have access to it.</p>
          <Link to="/student" className="take-back">
            ← Back to dashboard
          </Link>
        </section>
      </div>
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    try {
      submitQuiz(quiz!.id, quiz!.questions.map(q => answers[q.id]))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
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

            <button type="submit" disabled={answered !== total}>
              Submit quiz
            </button>
          </div>
        </form>
      )}
    </div>
  )
}