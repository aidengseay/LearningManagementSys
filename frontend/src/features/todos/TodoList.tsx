import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getUnifiedTodos, type UnifiedTodo } from '../../api/assignments'

export default function TodoList() {
  const [visible, setVisible] = useState<UnifiedTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getUnifiedTodos().then(items => { if (active) setVisible(items) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load to-do list') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <section className="dashboard-panel dashboard-todo-panel">
    <div className="dashboard-panel-heading"><div><span className="dashboard-eyebrow dashboard-eyebrow-dark">WHAT'S NEXT</span>
      <h2>To-do list</h2></div><span className="dashboard-section-count">{visible.length} pending</span></div>
    {loading ? <p>Loading to-do list…</p> : error ? <p role="alert" className="error">{error}</p>
      : visible.length === 0 ? <div className="dashboard-empty dashboard-empty-compact"><h3>You're all caught up!</h3><p>No outstanding quizzes or assignments.</p></div>
      : <div className="dashboard-todo-list">{visible.map(item => <div key={`${item.type}:${item.id}`} className="dashboard-todo-item">
        <div className="dashboard-todo-marker"/><div className="dashboard-todo-info"><strong>{item.title}</strong>
        <span>{item.type.toLowerCase()} · {item.courseName} · Due {new Date(item.due).toLocaleString()} {item.overdue ? '· Overdue' : ''}</span></div>
        <Link className="dashboard-text-link" to={item.type === 'QUIZ' ? `/quizzes/${item.id}` : `/assignments/${item.id}`}>Start</Link>
      </div>)}</div>}
  </section>
}
