import { Link } from 'react-router'
import MarkdownText from '../../components/MarkdownText'

interface CourseCardProps {
  course: {
    id: number
    name: string
    description?: string | null
    studentIds?: number[]
  }
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link to={`/courses/${course.id}`} className="course-card dashboard-course-card">
      <div className="course-card-topline">
        <span className="course-card-mark">2 ½ LMS</span>
        <span className="course-card-arrow" aria-hidden="true">↗</span>
      </div>
      <h3>{course.name}</h3>
      <MarkdownText className="course-card-description" text={course.description || 'Open this course to view its materials and activities.'} />
      <div className="course-card-footer">
        {typeof course.studentIds?.length === 'number' && (
          <span>{course.studentIds.length} {course.studentIds.length === 1 ? 'student' : 'students'}</span>
        )}
        <span className="course-card-link">View course</span>
      </div>
    </Link>
  )
}
