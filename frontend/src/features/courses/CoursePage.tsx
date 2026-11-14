import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAppStore } from '../app/store'
import QuizList from '../quizzes/QuizList'
import AnnouncementList from '../announcements/AnnouncementList'
import InstructorCourseTools from './InstructorCourseTools'
import InstructorTools from './InstructorTools'

export default function CoursePage() {
  const { courseId } = useParams()
  const { user, courses } = useAppStore()
  const [quizVersion, setQuizVersion] = useState(0)
  const [announcementVersion, setAnnouncementVersion] = useState(0)
  const course = courses.find(c => c.id === Number(courseId))

  if (
    !course ||
    !user ||
    (user.role === 'STUDENT' && !course.studentIds.includes(user.id)) ||
    (user.role === 'INSTRUCTOR' && course.instructorId !== user.id)
  ) {
    return <div className="course-page stack"><section className="course-empty panel">
      <h2>Course unavailable</h2>
      <p>This course could not be found or you do not have permission to view it.</p>
      <Link to={user?.role === 'STUDENT' ? '/student' : '/instructor'} className="course-back-link">Return to dashboard</Link>
    </section></div>
  }

  return <div className="course-page stack">
    <section className="dashboard-hero"><div className="dashboard-hero-content">
      <span className="dashboard-eyebrow">2 ½ LMS · COURSE</span>
      <h1>{course.name}</h1>
      <p>{course.description || 'Welcome to your course. Check below for assessments and announcements.'}</p>
      <div className="course-hero-actions">
        <Link to={`/courses/${course.id}/grades`} className="course-primary-button">View gradebook</Link>
        <Link to={user.role === 'STUDENT' ? '/student' : '/instructor'} className="course-secondary-button">Back to dashboard</Link>
      </div>
    </div></section>

    {user.role === 'INSTRUCTOR' && <>
      <InstructorCourseTools courseId={course.id} />
      <section className="course-tools panel">
        <div className="course-section-heading"><div><p className="course-eyebrow">INSTRUCTOR TOOLS</p><h2>Manage your course</h2><p>Enroll students, build assessments, or post announcements.</p></div></div>
        <InstructorTools
          courseId={course.id}
          onQuizCreated={() => setQuizVersion(value => value + 1)}
          onAnnouncementCreated={() => setAnnouncementVersion(value => value + 1)}
        />
      </section>
    </>}

    <section className="course-content-section panel">
      <div className="course-section-heading"><div><p className="course-eyebrow">ASSESSMENTS</p><h2>Quizzes and assignments</h2><p>View the assessments available in this course.</p></div></div>
      <QuizList courseId={course.id} refreshKey={quizVersion} />
    </section>

    <section className="course-content-section panel">
      <div className="course-section-heading"><div><p className="course-eyebrow">COURSE UPDATES</p><h2>Announcements</h2><p>Stay up to date with the latest course information.</p></div></div>
      <AnnouncementList courseId={course.id} refreshKey={announcementVersion} />
    </section>
  </div>
}
