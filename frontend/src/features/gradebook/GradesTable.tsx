
import type { Quiz, Submission } from '../demo/store'

export default function GradesTable({
  quizzes,
  submissions
}: {
  quizzes: Quiz[]
  submissions: Submission[]
}) {
  if (quizzes.length === 0) {
    return (
      <div className="grades-empty">
        <p>No assessments have been created for this course yet.</p>
      </div>
    )
  }

  return (
    <div className="grades-table-wrap">
      <table className="grades-table">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>

        <tbody>
          {quizzes.map(quiz => {
            const submission = submissions.find(s => s.quizId === quiz.id)

            const percentage = submission && submission.total > 0
              ? Math.round((submission.score / submission.total) * 100)
              : null

            return (
              <tr key={quiz.id}>
                <td className="grades-assessment-name">{quiz.title}</td>

                <td>
                  {submission
                    ? `${submission.score}/${submission.total}`
                    : <span className="grades-not-submitted">Not submitted</span>}
                </td>

                <td>
                  {percentage !== null ? (
                    <span className="grades-percentage">{percentage}%</span>
                  ) : (
                    <span className="grades-no-grade">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
