import { Link, useParams } from 'react-router'
import { useDemo } from '../demo/store'
import QuizList from '../quizzes/QuizList'
import QuizCreator from '../quizzes/QuizCreator'
import AnnouncementList from '../announcements/AnnouncementList'
import AnnouncementForm from '../announcements/AnnouncementForm'
import EnrollStudentForm from './EnrollStudentForm'
export default function CoursePage() {
  const { courseId } = useParams(); const { user, courses } = useDemo()
  const course = courses.find(c => c.id === Number(courseId))
  if (!course || !user || (user.role === 'STUDENT' && !course.studentIds.includes(user.id)) ||
      (user.role === 'INSTRUCTOR' && course.instructorId !== user.id)) return <p>Course not found or access denied.</p>
  return <div className="stack"><header><h1>{course.name}</h1><p>{course.description}</p></header>
    {user.role === 'INSTRUCTOR' && <EnrollStudentForm courseId={course.id} />}
    <QuizList courseId={course.id} />
    {user.role === 'INSTRUCTOR' && <QuizCreator courseId={course.id} />}
    <AnnouncementList courseId={course.id} />
    {user.role === 'INSTRUCTOR' && <AnnouncementForm courseId={course.id} />}
    <Link to={`/courses/${course.id}/grades`}>View grades (local demo)</Link>
  </div>
}
