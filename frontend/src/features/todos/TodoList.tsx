import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getTodos } from '../../api/quizzes'
import type { TodoItem } from '../../api/types'

export default function TodoList() {
  const [visible, setVisible] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getTodos()
      .then(items => { if (active) setVisible(items) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load to-do list') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <section className="dashboard-panel dashboard-todo-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-eyebrow dashboard-eyebrow-dark">WHAT'S NEXT</span>
          <h2>To-do list</h2>
        </div>
        <span className="dashboard-section-count">{visible.length} pending</span>
      </div>

      {loading ? (
        <p className="muted">Loading to-do list…</p>
      ) : error ? (
        <p role="alert" className="error">{error}</p>
      ) : visible.length === 0 ? (
        <div className="dashboard-empty dashboard-empty-compact">
          <h3>You're all caught up!</h3>
          <p>There are no outstanding quizzes right now.</p>
        </div>
      ) : (
        <div className="dashboard-todo-list">
          {visible.map(quiz => (
            <div className="dashboard-todo-item" key={quiz.quizId}>
              <div className="dashboard-todo-marker" aria-hidden="true" />
              <div className="dashboard-todo-info">
                <strong>{quiz.title}</strong>
                <span>Due {quiz.due}</span>
              </div>
              <Link className="dashboard-text-link" to={`/quizzes/${quiz.quizId}`}>Start</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
