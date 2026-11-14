
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getGradebook, getMyGrades } from '../../api/quizzes'
import type { StudentGrades } from '../../api/types'
import { useAppStore } from '../app/store'
import GradesTable from './GradesTable'

export default function GradebookPage() {
  const { courseId } = useParams()
  const { user, courses } = useAppStore()
  const [reports, setReports] = useState<StudentGrades[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const course = courses.find(c => c.id === Number(courseId))

  useEffect(() => {
    let active = true
    const id = Number(courseId)
    if (!user || !Number.isInteger(id)) {
      setLoading(false)
      return
    }
    const request = user.role === 'STUDENT'
      ? getMyGrades(id).then(report => [report])
      : getGradebook(id).then(gradebook => gradebook.students)
    request
      .then(data => { if (active) setReports(data) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load grades') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [courseId, user])

  if (
    !course ||
    !user ||
    (user.role === 'STUDENT' && !course.studentIds.includes(user.id)) ||
    (user.role === 'INSTRUCTOR' && course.instructorId !== user.id)
  ) {
    return (
      <div className="gradebook-page stack">
        <section className="panel gradebook-empty">
          <h2>Gradebook unavailable</h2>
          <p>This gradebook could not be found or you do not have permission to view it.</p>
          <Link to={user?.role === 'STUDENT' ? '/student' : '/instructor'} className="gradebook-back-link">
            Return to dashboard
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="gradebook-page stack">
      <section className="gradebook-hero">
        <div>
          <p className="course-eyebrow">2 ½ LMS · GRADES</p>
          <h1>{course.name}</h1>
          <p>
            {user.role === 'STUDENT'
              ? 'Review your assessment scores and course progress.'
              : 'Review assessment results for students in this course.'}
          </p>
        </div>

        <Link to={`/courses/${course.id}`} className="gradebook-back-button">
          Back to course
        </Link>
      </section>

      {loading ? (
        <section className="panel"><p>Loading grades…</p></section>
      ) : error ? (
        <section className="panel"><p role="alert" className="error">{error}</p></section>
      ) : user.role === 'STUDENT' ? (
        <section className="gradebook-student-section panel">
          <div className="course-section-heading">
            <div>
              <p className="course-eyebrow">YOUR RESULTS</p>
              <h2>My grades</h2>
              <p>Your scores for assessments in this course.</p>
            </div>
          </div>

          <GradesTable grades={reports[0]?.grades ?? []} />
        </section>
      ) : (
        <section className="gradebook-instructor-section">
          <div className="course-section-heading">
            <div>
              <p className="course-eyebrow">CLASS RESULTS</p>
              <h2>Student grade reports</h2>
              <p>Individual assessment results for each enrolled student.</p>
            </div>
          </div>

          {reports.length > 0 ? (
            <div className="gradebook-student-list">
              {reports.map(report => (
                <section key={report.studentId} className="gradebook-student-card panel">
                  <div className="gradebook-student-heading">
                    <div>
                      <p className="course-eyebrow">STUDENT REPORT</p>
                      <h3>{report.studentName}</h3>
                      <p>{report.studentEmail}</p>
                    </div>
                  </div>

                  <GradesTable grades={report.grades} />
                </section>
              ))}
            </div>
          ) : (
            <div className="panel gradebook-empty">
              <h3>No students enrolled yet</h3>
              <p>Once students enroll in this course, their grade reports will appear here.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
