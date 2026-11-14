import { useState } from 'react'
import { useDemo } from '../demo/store'
import CourseCard from '../courses/CourseCard'
import CreateCourseForm from '../courses/CreateCourseForm'
import InstructorTools from '../courses/InstructorTools'

export default function InstructorDashboard() {
  const { user, courses, quizzes } = useDemo()

  const mine = courses.filter(course => course.instructorId === user?.id)
  const [toolCourseId, setToolCourseId] = useState<number | null>(null)
  // Fall back to the first course if nothing is picked (or the pick no longer exists)
  const selectedCourseId = mine.some(course => course.id === toolCourseId)
    ? toolCourseId
    : mine[0]?.id ?? null
  const enrolledCount = mine.reduce(
    (total, course) => total + course.studentIds.length,
    0
  )

  const courseIds = new Set(mine.map(course => course.id))
  const quizCount = quizzes.filter(quiz =>
    courseIds.has(quiz.courseId)
  ).length

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

      {/* Instructor tools: one tool at a time, for the chosen course */}
      <section className="dashboard-create-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow dashboard-eyebrow-dark">
              INSTRUCTOR TOOLS
            </span>
            <h2>Manage a course</h2>
            <p>
              Choose a course, then pick a tool to enroll students, build an
              assessment, or post an announcement.
            </p>
          </div>
        </div>

        {selectedCourseId !== null ? (
          <div className="instructor-tools-card">
            <div className="instructor-course-picker">
              <label htmlFor="tools-course">Course</label>
              <select
                id="tools-course"
                value={selectedCourseId}
                onChange={event => setToolCourseId(Number(event.target.value))}
              >
                {mine.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* key resets unsent drafts when switching course, so nothing is posted to the wrong one */}
            <InstructorTools key={selectedCourseId} courseId={selectedCourseId} />
          </div>
        ) : (
          <div className="dashboard-empty">
            <h3>Create a course first</h3>
            <p>These tools become available once you have a course.</p>
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