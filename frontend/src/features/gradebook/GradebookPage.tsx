
import { Link, useParams } from 'react-router'
import { useDemo } from '../demo/store'
import GradesTable from './GradesTable'

export default function GradebookPage() {
  const { courseId } = useParams()
  const { user, courses, quizzes, submissions } = useDemo()

  const course = courses.find(c => c.id === Number(courseId))

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

  const courseQuizzes = quizzes.filter(q => q.courseId === course.id)

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

      {user.role === 'STUDENT' ? (
        <section className="gradebook-student-section panel">
          <div className="course-section-heading">
            <div>
              <p className="course-eyebrow">YOUR RESULTS</p>
              <h2>My grades</h2>
              <p>Your scores for assessments in this course.</p>
            </div>
          </div>

          <GradesTable
            quizzes={courseQuizzes}
            submissions={submissions.filter(s => s.studentId === user.id)}
          />
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

          {course.studentIds.length > 0 ? (
            <div className="gradebook-student-list">
              {course.studentIds.map(id => (
                <section key={id} className="gradebook-student-card panel">
                  <div className="gradebook-student-heading">
                    <div>
                      <p className="course-eyebrow">STUDENT REPORT</p>
                      <h3>Student #{id}</h3>
                    </div>
                  </div>

                  <GradesTable
                    quizzes={courseQuizzes}
                    submissions={submissions.filter(s => s.studentId === id)}
                  />
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
