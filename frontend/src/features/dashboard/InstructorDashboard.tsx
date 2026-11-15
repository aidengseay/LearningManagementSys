import { useEffect, useState } from 'react'
import { useAppStore } from '../app/store'
import { getQuizzes } from '../../api/quizzes'
import CourseCard from '../courses/CourseCard'
import CreateCourseForm from '../courses/CreateCourseForm'

export default function InstructorDashboard() {
  const { user, courses } = useAppStore()
  const [quizCount, setQuizCount] = useState(0)

  const mine = courses.filter(course => course.instructorId === user?.id)
  const enrolledCount = mine.reduce(
    (total, course) => total + course.studentIds.length,
    0
  )

  useEffect(() => {
    let active = true
    Promise.all(mine.map(course => getQuizzes(course.id)))
      .then(results => { if (active) setQuizCount(results.reduce((sum, items) => sum + items.length, 0)) })
      .catch(() => { if (active) setQuizCount(0) })
    return () => { active = false }
  }, [courses])

  return (
    <div className="dashboard-page">
      {/* Portal header */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-eyebrow">INSTRUCTOR PORTAL</span>
          <h1>Welcome back, {user?.name || 'Instructor'}</h1>
          <p>
            Manage your courses, create assessments, and keep your students
            moving forward.
          </p>
        </div>
      </section>

      {/* Instructor statistics */}
      <section className="dashboard-stats" aria-label="Instructor overview">
        <article className="dashboard-stat">
          <span className="dashboard-stat-label">My courses</span>
          <strong>{mine.length}</strong>
          <span className="dashboard-stat-detail">Courses you teach</span>
        </article>

        <article className="dashboard-stat">
          <span className="dashboard-stat-label">Enrolled students</span>
          <strong>{enrolledCount}</strong>
          <span className="dashboard-stat-detail">Across your courses</span>
        </article>

        <article className="dashboard-stat">
          <span className="dashboard-stat-label">Quizzes</span>
          <strong>{quizCount}</strong>
          <span className="dashboard-stat-detail">Created assessments</span>
        </article>
      </section>

      {/* Courses */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow dashboard-eyebrow-dark">
              COURSE MANAGEMENT
            </span>
            <h2>My courses</h2>
          </div>

          <span className="dashboard-section-count">
            {mine.length} {mine.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {mine.length > 0 ? (
          <div className="cards dashboard-course-grid">
            {mine.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <h3>No courses created yet</h3>
            <p>
              When you create a course, it will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Create a course */}
      <section className="dashboard-create-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow dashboard-eyebrow-dark">
              NEW COURSE
            </span>
            <h2>Create a course</h2>
            <p>
              Start a new class and make it available to your students.
            </p>
          </div>
        </div>

        <div className="instructor-tools-card">
          <CreateCourseForm />
        </div>
      </section>
    </div>
  )
}
