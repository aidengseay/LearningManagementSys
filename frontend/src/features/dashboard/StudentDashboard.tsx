import { useEffect, useState, type FormEvent } from 'react'
import { getQuizzes } from '../../api/quizzes'
import { useAppStore } from '../app/store'
import CourseCard from '../courses/CourseCard'
import TodoList from '../todos/TodoList'
export default function StudentDashboard() {
  const { user, courses, joinCourse } = useAppStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [quizCounts, setQuizCounts] = useState({ outstanding: 0, completed: 0 })
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(''); setSuccess('')
    setBusy(true)
    try { await joinCourse(code); setCode(''); setSuccess('Course joined successfully.') }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to join course') }
    finally { setBusy(false) }
  }
  const mine = courses.filter(c => user && c.studentIds.includes(user.id))

  useEffect(() => {
    let active = true
    Promise.all(mine.map(course => getQuizzes(course.id)))
      .then(results => {
        if (!active) return
        const quizzes = results.flat()
        const completed = quizzes.filter(quiz => quiz.submitted).length
        setQuizCounts({ completed, outstanding: quizzes.length - completed })
      })
      .catch(() => { if (active) setQuizCounts({ outstanding: 0, completed: 0 }) })
    return () => { active = false }
  }, [courses])

  return <div className="dashboard-page">
    <section className="dashboard-hero"><div className="dashboard-hero-content">
      <span className="dashboard-eyebrow">STUDENT PORTAL</span>
      <h1>Welcome back, {user?.name || 'Student'}</h1>
      <p>Your classes, coursework, and upcoming assessments all in one place.</p>
    </div></section>

    <section className="dashboard-stats" aria-label="Student overview">
      <article className="dashboard-stat"><span className="dashboard-stat-label">My courses</span><strong>{mine.length}</strong><span className="dashboard-stat-detail">Enrolled classes</span></article>
      <article className="dashboard-stat"><span className="dashboard-stat-label">To-do</span><strong>{quizCounts.outstanding}</strong><span className="dashboard-stat-detail">Unsubmitted quizzes</span></article>
      <article className="dashboard-stat"><span className="dashboard-stat-label">Completed</span><strong>{quizCounts.completed}</strong><span className="dashboard-stat-detail">Submitted quizzes</span></article>
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><span className="dashboard-eyebrow dashboard-eyebrow-dark">YOUR LEARNING</span><h2>My courses</h2></div><span className="dashboard-section-count">{mine.length} {mine.length === 1 ? 'course' : 'courses'}</span></div>
      {mine.length > 0 ? <div className="cards dashboard-course-grid">{mine.map(course => <CourseCard key={course.id} course={course} />)}</div> : <div className="dashboard-empty"><h3>No courses yet</h3><p>Join a class using the enrollment code from your instructor.</p></div>}
    </section>

    <div className="dashboard-lower-grid">
      <TodoList />
      <aside className="dashboard-tip"><span className="dashboard-tip-mark">2 ½</span><h3>Stay on track</h3><p>Check your to-do list regularly so you don't miss an upcoming quiz or assessment.</p></aside>
    </div>
  </div>
}
