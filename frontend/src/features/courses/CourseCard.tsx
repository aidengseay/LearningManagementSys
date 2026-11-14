
import { Link } from 'react-router'

interface CourseCardProps {
  course: {
    id: number
    name: string
    description?: string | null
  }
}

export default function CourseCard({
  course,
}: CourseCardProps) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="course-card"
    >
      <h3>{course.name}</h3>

      {course.description && (
        <p>{course.description}</p>
      )}

      <span>View Course →</span>
    </Link>
  )
}
