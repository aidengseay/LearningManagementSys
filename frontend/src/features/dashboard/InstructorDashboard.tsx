import { useDemo } from '../demo/store'
import CourseCard from '../courses/CourseCard'
import CreateCourseForm from '../courses/CreateCourseForm'
export default function InstructorDashboard() {
  const { user, courses } = useDemo()
  return <div className="stack"><h1>Instructor Dashboard</h1><p>Welcome, {user?.name}</p><h2>My classes</h2><div className="cards">{courses.filter(c => c.instructorId === user?.id).map(c => <CourseCard key={c.id} course={c} />)}</div><CreateCourseForm /></div>
}
