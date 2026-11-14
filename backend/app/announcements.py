"""Course announcements; existing JWT/course enrollment permissions are reused."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, require_instructor
from app.models import Announcement, Course, Enrollment, User

router = APIRouter(prefix='/api', tags=['Announcements'])


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=10000)


class AnnouncementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    courseId: int
    title: str
    content: str
    createdAt: datetime


def announcement_out(row: Announcement) -> AnnouncementOut:
    return AnnouncementOut(
        id=row.id,
        courseId=row.course_id,
        title=row.title,
        content=row.content,
        createdAt=row.created_at,
    )


def authorized_course(course_id: int, user: User, db: Session) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail='Course not found')
    if user.role == 'INSTRUCTOR' and course.instructor_id == user.id:
        return course
    if user.role == 'STUDENT' and db.scalar(
        select(Enrollment.id).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == user.id,
        )
    ) is not None:
        return course
    raise HTTPException(status_code=403, detail='Not authorized for this course')


@router.get('/courses/{course_id}/announcements', response_model=list[AnnouncementOut])
def list_announcements(
    course_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    authorized_course(course_id, user, db)
    rows = db.scalars(
        select(Announcement)
        .where(Announcement.course_id == course_id)
        .order_by(Announcement.created_at.desc(), Announcement.id.desc())
    ).all()
    return [announcement_out(row) for row in rows]


@router.post(
    '/courses/{course_id}/announcements',
    response_model=AnnouncementOut,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    course_id: int,
    body: AnnouncementCreate,
    instructor: User = Depends(require_instructor),
    db: Session = Depends(get_db),
):
    authorized_course(course_id, instructor, db)
    title = body.title.strip()
    content = body.content.strip()
    if not title or not content:
        raise HTTPException(status_code=422, detail='Title and content cannot be blank')
    announcement = Announcement(course_id=course_id, title=title, content=content)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement_out(announcement)
