import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useDemo } from '../demo/store'
import QuestionCard from './QuestionCard'
export default function QuizPage() {
  const { quizId } = useParams(); const { user, quizzes, courses, submissions, submitQuiz } = useDemo()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const quiz = quizzes.find(q => q.id === Number(quizId))
  const course = quiz && courses.find(c => c.id === quiz.courseId)
  const previous = submissions.find(s => s.quizId === quiz?.id && s.studentId === user?.id)
  if (!quiz || !course || user?.role !== 'STUDENT' || !course.studentIds.includes(user.id)) return <p>Quiz unavailable.</p>
  function submit(e: FormEvent) { e.preventDefault(); try { submitQuiz(quiz!.id, quiz!.questions.map(q => answers[q.id])); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed') } }
  return <section className="stack"><h1>{quiz.title}</h1><p>Due: {quiz.due}</p>
    {previous ? <section className="panel"><h2>Submitted</h2><p>Your score: {previous.score}/{previous.total} ({Math.round(previous.score / previous.total * 100)}%)</p><Link to={`/courses/${quiz.courseId}`}>Back to course</Link></section> :
      <form className="stack" onSubmit={submit}>{quiz.questions.map(q => <QuestionCard key={q.id} question={q} selected={answers[q.id]} onChange={value => setAnswers(a => ({ ...a, [q.id]: value }))} />)}
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" disabled={Object.keys(answers).length !== quiz.questions.length}>Submit quiz</button></form>}
  </section>
}
