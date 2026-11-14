import { Link } from 'react-router'
import { useDemo } from '../demo/store'

export default function TodoList() {
  const { user, courses, quizzes, submissions } = useDemo()
  const visible = quizzes
    .filter(quiz =>
      courses.some(course =>
        course.id === quiz.courseId && user && course.studentIds.includes(user.id)
      ) &&
      !submissions.some(submission =>
        submission.quizId === quiz.id && submission.studentId === user?.id
      )
    )
    .sort((a, b) => a.due.localeCompare(b.due))

  return (
    <section className="dashboard-panel dashboard-todo-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">WHAT'S NEXT</span>
          <h2>To-do list</h2>
        </div>
        <span className="dashboard-section-count">{visible.length} pending</span>
      </div>

      {visible.length === 0 ? (
        <div className="dashboard-empty dashboard-empty-compact">
          <h3>You're all caught up!</h3>
          <p>There are no outstanding quizzes right now.</p>
        </div>
      ) : (
        <div className="dashboard-todo-list">
          {visible.map(quiz => (
            <div className="dashboard-todo-item" key={quiz.id}>
              <div className="dashboard-todo-marker" aria-hidden="true" />
              <div className="dashboard-todo-info">
                <strong>{quiz.title}</strong>
                <span>Due {quiz.due}</span>
              </div>
              <Link className="dashboard-text-link" to={`/quizzes/${quiz.id}`}>Start</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
