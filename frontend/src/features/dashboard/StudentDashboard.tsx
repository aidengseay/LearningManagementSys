import { useDemo } from '../demo/store'
import CourseCard from '../courses/CourseCard'
import TodoList from '../todos/TodoList'
export default function StudentDashboard() {
  const { user, courses } = useDemo()
  const mine = courses.filter(c => user && c.studentIds.includes(user.id))
  return <div className="stack"><h1>Student Dashboard</h1><p>Welcome, {user?.name}</p><h2>My classes</h2><div className="cards">{mine.map(c => <CourseCard key={c.id} course={c} />)}</div><TodoList /></div>
}
