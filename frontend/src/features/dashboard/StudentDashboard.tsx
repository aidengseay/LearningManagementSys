import { useDemo } from '../demo/store'
import CourseCard from '../courses/CourseCard'
import TodoList from '../todos/TodoList'

export default function StudentDashboard() {
  const { user, courses, quizzes, submissions } = useDemo()

  const mine = courses.filter(course => user && course.studentIds.includes(user.id))
  const myCourseIds = new Set(mine.map(course => course.id))
  const myQuizzes = quizzes.filter(quiz => myCourseIds.has(quiz.courseId))
  const completedQuizzes = myQuizzes.filter(quiz =>
    submissions.some(submission =>
      submission.quizId === quiz.id && submission.studentId === user?.id
    )
  )
  const outstandingQuizzes = myQuizzes.length - completedQuizzes.length

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-eyebrow">STUDENT PORTAL</span>
          <h1>Welcome back, {user?.name || 'Student'}</h1>
          <p>Your classes, coursework, and upcoming assessments all in one place.</p>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Student overview">
        <article className="dashboard-stat">
          <span className="dashboard-stat-label">My courses</span>
          <strong>{mine.length}</strong>
          <span className="dashboard-stat-detail">Enrolled classes</span>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat-label">To-do</span>
          <strong>{outstandingQuizzes}</strong>
          <span className="dashboard-stat-detail">Unsubmitted quizzes</span>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat-label">Completed</span>
          <strong>{completedQuizzes.length}</strong>
          <span className="dashboard-stat-detail">Submitted quizzes</span>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-eyebrow dashboard-eyebrow-dark">YOUR LEARNING</span>
            <h2>My courses</h2>
          </div>
          <span className="dashboard-section-count">{mine.length} {mine.length === 1 ? 'course' : 'courses'}</span>
        </div>

        {mine.length > 0 ? (
          <div className="cards dashboard-course-grid">
            {mine.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        ) : (
          <div className="dashboard-empty">
            <h3>No courses yet</h3>
            <p>Your enrolled courses will appear here.</p>
          </div>
        )}
      </section>

      <div className="dashboard-lower-grid">
        <TodoList />
        <aside className="dashboard-tip">
          <span className="dashboard-tip-mark">2 ½</span>
          <h3>Stay on track</h3>
          <p>Check your to-do list regularly so you don't miss an upcoming quiz or assessment.</p>
        </aside>
      </div>
    </div>
  )
}
