import { useEffect, useState } from 'react'
import { getCourseStudentsRequest, getJoinCodeRequest } from '../../api/courses'
import type { User } from '../../api/types'

export default function InstructorCourseTools({ courseId }: { courseId: number }) {
  const [code, setCode] = useState('')
  const [students, setStudents] = useState<User[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([getJoinCodeRequest(courseId), getCourseStudentsRequest(courseId)])
      .then(([join, roster]) => { if (active) { setCode(join.code); setStudents(roster) } })
      .catch((err: Error) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [courseId])
  return <section className="course-content-section panel stack">
    <div className="course-section-heading"><div><p className="course-eyebrow">COURSE ACCESS</p><h2>Student enrollment</h2><p>Share the course code and review the current roster.</p></div></div>
    {error && <p className="error" role="alert">{error}</p>}
    {code && <p>Share this enrollment code with students: <strong>{code}</strong></p>}
    <h3>Enrolled students ({students.length})</h3>
    {students.length === 0 ? <p>No students enrolled yet.</p> :
      <ul>{students.map(s => <li key={s.id}>{s.name} ({s.email})</li>)}</ul>}
  </section>
}
