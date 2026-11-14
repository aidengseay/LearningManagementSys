import { Link } from 'react-router'
import { useDemo } from '../demo/store'
export default function QuizList({ courseId }: { courseId: number }) {
  const { quizzes, submissions, user } = useDemo()
  return <section className="panel"><h2>Quizzes</h2>{quizzes.filter(q => q.courseId === courseId).map(q => {
    const done = submissions.find(s => s.quizId === q.id && s.studentId === user?.id)
    return <div className="list-row" key={q.id}><div><strong>{q.title}</strong><div className="muted">Due: {q.due}</div></div>
      {done ? <span>{done.score}/{done.total}</span> : user?.role === 'STUDENT' ? <Link to={`/quizzes/${q.id}`}>Take quiz</Link> : <span>{q.questions.length} questions</span>}</div>
  })}</section>
}
