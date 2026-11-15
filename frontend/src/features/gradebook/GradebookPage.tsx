import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getUnifiedGradebook, getUnifiedMyGrades, type GradeItem, type StudentReport } from '../../api/assignments'
import { useAppStore } from '../app/store'
import { initials } from '../assignments/format'

// Status values come from the API, so unknown ones fall back to a neutral gray chip
function statusLabel(status: string) {
  const text = status.replaceAll('_', ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function statusTone(status: string) {
  const text = status.replaceAll('_', ' ').toLowerCase()
  if (text.includes('not submitted') || text.includes('missing')) return 'bad'
  if (text.includes('late')) return 'warn'
  if (text.startsWith('graded')) return 'good'
  if (text.includes('submitted') || text.includes('await') || text.includes('pending')) return 'info'
  return 'muted'
}

function GradeRows({ report, isInstructor }: { report: StudentReport; isInstructor: boolean }) {
  const progress = report.possiblePoints > 0
    ? Math.min(100, Math.max(0, (report.earnedPoints / report.possiblePoints) * 100))
    : 0

  return (
    <section className="gb-card">
      <div className="gb-card-head">
        <div className="gb-student">
          <span className={`gb-avatar av-${Number(report.studentId) % 5 || 0}`} aria-hidden="true">
            {initials(report.studentName)}
          </span>
          <div className="gb-student-text">
            <h3>{report.studentName}</h3>
            <span>{report.studentEmail}</span>
          </div>
        </div>

        <div className="gb-summary">
          <span className="gb-summary-label">Current grade</span>
          {report.overallPercentage === null ? (
            <strong className="gb-summary-none">Not graded yet</strong>
          ) : (
            <strong className="gb-summary-value">{report.overallPercentage}%</strong>
          )}
          <span className="gb-summary-points">
            {report.earnedPoints}/{report.possiblePoints} points
          </span>
        </div>
      </div>

      <div
        className="gb-progress"
        role="progressbar"
        aria-label="Points earned"
        aria-valuemin={0}
        aria-valuemax={report.possiblePoints}
        aria-valuenow={report.earnedPoints}
      >
        <div className="gb-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="gb-table-wrap">
        <table className="gb-table">
          <thead>
            <tr>
              <th>Assessment</th>
              <th>Points</th>
              <th>Status</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {report.grades.map((item: GradeItem) => (
              <tr key={`${item.type}:${item.id}`}>
                <td>
                  <div className="gb-assessment">
                    {item.type === 'QUIZ' && isInstructor ? (
                      <strong>{item.title}</strong>
                    ) : (
                      <Link
                        className="gb-link"
                        to={item.type === 'QUIZ' ? `/quizzes/${item.id}` : `/assignments/${item.id}`}
                      >
                        {item.title}
                      </Link>
                    )}
                    <span className="gb-type">{item.type.toLowerCase()}</span>
                  </div>
                </td>
                <td className="gb-num">
                  {item.earned === null ? `— / ${item.possible}` : `${item.earned} / ${item.possible}`}
                </td>
                <td>
                  <span className={`gb-chip ${statusTone(item.status)}`}>{statusLabel(item.status)}</span>
                </td>
                <td>
                  {item.percentage === null
                    ? <span className="gb-dash">—</span>
                    : <span className="gb-grade">{item.percentage}%</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function GradebookPage() {
  const { courseId } = useParams()
  const { user, courses } = useAppStore()
  const id = Number(courseId)
  const course = courses.find(c => c.id === id)
  const [reports, setReports] = useState<StudentReport[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    const request = user.role === 'STUDENT'
      ? getUnifiedMyGrades(id).then(report => [report])
      : getUnifiedGradebook(id).then(book => book.students)
    request.then(data => { if (active) setReports(data) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load grades') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, user])

  if (!course || !user) return <section className="gb-state">Course unavailable.</section>

  return (
    <div className="gradebook-page gb-page">
      <section className="gradebook-hero"><div><p className="course-eyebrow">2 ½ LMS · GRADES</p>
        <h1>{course.name}</h1><p>Quizzes and assignments · points-based grading</p></div>
        <Link className="gradebook-back-button" to={`/courses/${id}`}>Back to course</Link>
      </section>

      {loading ? <section className="gb-state">Loading grades…</section>
        : error ? <section className="gb-state gb-state-error" role="alert">{error}</section>
        : reports.length === 0 ? <section className="gb-state">No students enrolled yet.</section>
        : reports.map(report => (
            <GradeRows key={report.studentId} report={report} isInstructor={user.role === 'INSTRUCTOR'} />
          ))}
    </div>
  )
}