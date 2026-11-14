
import type { GradeEntry } from '../../api/types'

export default function GradesTable({
  grades
}: {
  grades: GradeEntry[]
}) {
  if (grades.length === 0) {
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
          {grades.map(grade => {
            return (
              <tr key={grade.quizId}>
                <td className="grades-assessment-name">{grade.quizTitle}</td>

                <td>
                  {grade.score !== null
                    ? `${grade.score}/${grade.total}`
                    : <span className="grades-not-submitted">Not submitted</span>}
                </td>

                <td>
                  {grade.percentage !== null ? (
                    <span className="grades-percentage">{Math.round(grade.percentage)}%</span>
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
