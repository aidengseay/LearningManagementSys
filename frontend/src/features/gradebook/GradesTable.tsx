import type { Quiz, Submission } from '../demo/store'
export default function GradesTable({ quizzes, submissions }: { quizzes: Quiz[]; submissions: Submission[] }) {
  return <div className="table-wrap"><table><thead><tr><th>Assessment</th><th>Score</th><th>Grade</th></tr></thead><tbody>
    {quizzes.map(q => { const s = submissions.find(s => s.quizId === q.id); return <tr key={q.id}><td>{q.title}</td><td>{s ? `${s.score}/${s.total}` : 'Not submitted'}</td><td>{s ? `${Math.round(s.score / s.total * 100)}%` : '—'}</td></tr> })}
  </tbody></table></div>
}
