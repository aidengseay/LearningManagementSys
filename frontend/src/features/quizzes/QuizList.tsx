import { Link } from 'react-router'
import { useDemo } from '../demo/store'

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

export default function QuizList({ courseId }: { courseId: number }) {
  const { quizzes, submissions, user } = useDemo()
  const courseQuizzes = quizzes.filter(q => q.courseId === courseId)

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
        const done = submissions.find(
          s => s.quizId === q.id && s.studentId === user?.id
        )
        const count = q.questions.length

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
                  {done.score}/{done.total}
                </strong>
                <span>
                  {done.total
                    ? Math.round((done.score / done.total) * 100)
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