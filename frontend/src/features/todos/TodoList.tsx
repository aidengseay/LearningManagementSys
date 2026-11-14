import { Link } from 'react-router'
import { useDemo } from '../demo/store'
export default function TodoList() {
  const { user, courses, quizzes, submissions } = useDemo()
  const visible = quizzes.filter(q => courses.some(c => c.id === q.courseId && user && c.studentIds.includes(user.id)) && !submissions.some(s => s.quizId === q.id && s.studentId === user?.id)).sort((a, b) => a.due.localeCompare(b.due))
  return <section className="panel"><h2>To-do list</h2>{visible.length === 0 && <p>You're all caught up!</p>}
    {visible.map(q => <div className="list-row" key={q.id}><div><strong>{q.title}</strong><div className="muted">Due {q.due}</div></div><Link to={`/quizzes/${q.id}`}>Start</Link></div>)}
  </section>
}
