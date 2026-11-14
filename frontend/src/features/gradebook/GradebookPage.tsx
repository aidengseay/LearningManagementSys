import { useParams } from 'react-router'
import { useDemo } from '../demo/store'
import GradesTable from './GradesTable'
export default function GradebookPage() {
  const { courseId } = useParams(); const { user, courses, quizzes, submissions } = useDemo()
  const course = courses.find(c => c.id === Number(courseId))
  if (!course || !user || (user.role === 'STUDENT' && !course.studentIds.includes(user.id)) || (user.role === 'INSTRUCTOR' && course.instructorId !== user.id)) return <p>Gradebook unavailable.</p>
  const courseQuizzes = quizzes.filter(q => q.courseId === course.id)
  return <div className="stack"><h1>{course.name} — Gradebook</h1>{user.role === 'STUDENT' ?
    <section className="panel"><GradesTable quizzes={courseQuizzes} submissions={submissions.filter(s => s.studentId === user.id)} /></section> :
    course.studentIds.map(id => <section key={id} className="panel"><h2>Student #{id}</h2><GradesTable quizzes={courseQuizzes} submissions={submissions.filter(s => s.studentId === id)} /></section>)}
  </div>
}
