import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getUnifiedGradebook, getUnifiedMyGrades, type GradeItem, type StudentReport } from '../../api/assignments'
import { useAppStore } from '../app/store'

function GradeRows({ report, isInstructor }: { report: StudentReport; isInstructor: boolean }) {
  return <div className="stack">
    <h3>{report.studentName}</h3>
    <p>{report.studentEmail}</p>
    <p><strong>Current grade: {report.overallPercentage === null ? 'Not graded yet' : `${report.overallPercentage}%`}</strong>
      {' '}({report.earnedPoints}/{report.possiblePoints} points)</p>
    <div className="grades-table-wrap"><table className="grades-table">
      <thead><tr><th>Assessment</th><th>Points</th><th>Status</th><th>Grade</th></tr></thead>
      <tbody>{report.grades.map((item: GradeItem) => <tr key={`${item.type}:${item.id}`}>
        <td>{item.type === 'QUIZ' && isInstructor ? item.title :
          <Link to={item.type === 'QUIZ' ? `/quizzes/${item.id}` : `/assignments/${item.id}`}>{item.title}</Link>}
          <div className="muted">{item.type.toLowerCase()}</div></td>
        <td>{item.earned === null ? `— / ${item.possible}` : `${item.earned} / ${item.possible}`}</td>
        <td>{item.status.replaceAll('_', ' ').toLowerCase()}</td>
        <td>{item.percentage === null ? '—' : `${item.percentage}%`}</td>
      </tr>)}</tbody>
    </table></div>
  </div>
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
  if (!course || !user) return <section className="panel">Course unavailable.</section>
  return <div className="gradebook-page stack">
    <section className="gradebook-hero"><div><p className="course-eyebrow">2 ½ LMS · GRADES</p>
      <h1>{course.name}</h1><p>Quizzes and assignments · points-based grading</p></div>
      <Link className="gradebook-back-button" to={`/courses/${id}`}>Back to course</Link>
    </section>
    {loading ? <section className="panel">Loading grades…</section>
      : error ? <section className="panel error">{error}</section>
      : reports.length === 0 ? <section className="panel">No students enrolled yet.</section>
      : reports.map(report => <section className="panel" key={report.studentId}><GradeRows report={report} isInstructor={user.role === 'INSTRUCTOR'}/></section>)}
  </div>
}
