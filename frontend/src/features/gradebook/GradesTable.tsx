import type { GradeEntry } from '../../api/types'

export default function GradesTable({
  grades
}: {
  grades: GradeEntry[]
}) {
  if (grades.length === 0) {
    return (
      <div className="gb-state">
        <p>No assessments have been created for this course yet.</p>
      </div>
    )
  }

  return (
    <div className="gb-table-wrap">
      <table className="gb-table">
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
                <td>
                  <strong className="gb-assessment-name">{grade.quizTitle}</strong>
                </td>

                <td className="gb-num">
                  {grade.score !== null
                    ? `${grade.score}/${grade.total}`
                    : <span className="gb-chip bad">Not submitted</span>}
                </td>

                <td>
                  {grade.percentage !== null ? (
                    <span className="gb-grade">{Math.round(grade.percentage)}%</span>
                  ) : (
                    <span className="gb-dash">—</span>
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