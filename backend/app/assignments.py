"""Instructor-created assignments and private student submissions.

Files are kept in the existing persistent curriculum uploads volume, in a
separate assignments subdirectory. Downloads always check authorization.
"""
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, require_instructor
from app.models import Assignment, AssignmentSubmission, Course, Enrollment, User

router = APIRouter(prefix='/api', tags=['Assignments'])
UPLOAD_DIR = Path(os.environ.get('CURRICULUM_UPLOAD_DIR', '/app/uploads')) / 'assignments'
MAX_BYTES = 10 * 1024 * 1024


def now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=50000)
    dueAt: datetime
    maxPoints: int = Field(gt=0)
    submissionType: Literal['TEXT', 'PDF', 'BOTH'] = 'BOTH'

    @field_validator('title')
    @classmethod
    def nonblank(cls, value: str):
        if not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip()


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=50000)
    dueAt: datetime | None = None
    maxPoints: int | None = Field(default=None, gt=0)
    submissionType: Literal['TEXT', 'PDF', 'BOTH'] | None = None

    @field_validator('title')
    @classmethod
    def nonblank(cls, value: str | None):
        if value is not None and not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip() if value is not None else None


class TextBody(BaseModel):
    text: str = Field(min_length=1, max_length=100000)

    @field_validator('text')
    @classmethod
    def nonblank(cls, value: str):
        if not value.strip():
            raise ValueError('Submission text cannot be blank')
        return value


class GradeBody(BaseModel):
    pointsEarned: int = Field(ge=0)
    feedback: str = Field(default='', max_length=20000)


class AssignmentOut(BaseModel):
    id: int
    courseId: int
    title: str
    description: str
    dueAt: datetime
    maxPoints: int
    submissionType: str
    hasInstructionsPdf: bool
    submitted: bool | None = None
    graded: bool | None = None


class AssignmentSubmissionOut(BaseModel):
    id: int
    assignmentId: int
    studentId: int
    studentName: str
    submissionType: str | None
    text: str | None
    filename: str | None
    submittedAt: datetime | None
    late: bool
    pointsEarned: int | None
    percentage: float | None
    feedback: str
    gradedAt: datetime | None


def require_course(course_id: int, user: User, db: Session, edit: bool = False) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(404, 'Course not found')
    if user.role == 'INSTRUCTOR' and course.instructor_id == user.id:
        return course
    if not edit and user.role == 'STUDENT' and db.scalar(select(Enrollment.id).where(
        Enrollment.course_id == course_id, Enrollment.student_id == user.id,
    )) is not None:
        return course
    raise HTTPException(403, 'Not authorized for this course')


def require_assignment(assignment_id: int, user: User, db: Session, edit: bool = False) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(404, 'Assignment not found')
    require_course(assignment.course_id, user, db, edit=edit)
    return assignment


def get_submission(assignment_id: int, student_id: int, db: Session) -> AssignmentSubmission | None:
    return db.scalar(select(AssignmentSubmission).where(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student_id,
    ))


def out_assignment(a: Assignment, user: User, db: Session) -> AssignmentOut:
    s = get_submission(a.id, user.id, db) if user.role == 'STUDENT' else None
    return AssignmentOut(id=a.id, courseId=a.course_id, title=a.title, description=a.description,
                         dueAt=a.due_at, maxPoints=a.max_points, submissionType=a.submission_type,
                         hasInstructionsPdf=bool(a.instructions_file),
                         submitted=bool(s and s.submitted_at) if s is not None or user.role == 'STUDENT' else None,
                         graded=(s.points_earned is not None) if s is not None else False if user.role == 'STUDENT' else None)


def out_submission(s: AssignmentSubmission, a: Assignment, db: Session) -> AssignmentSubmissionOut:
    student = db.get(User, s.student_id)
    return AssignmentSubmissionOut(
        id=s.id, assignmentId=a.id, studentId=s.student_id, studentName=student.name if student else 'Unknown',
        submissionType=s.submission_type, text=s.text_content, filename=s.original_filename,
        submittedAt=s.submitted_at,
        late=bool(s.submitted_at and as_utc(s.submitted_at) > as_utc(a.due_at)),
        pointsEarned=s.points_earned,
        percentage=round(s.points_earned * 100 / a.max_points, 2) if s.points_earned is not None else None,
        feedback=s.feedback or '', gradedAt=s.graded_at,
    )


def delete_file(basename: str | None):
    if basename:
        try:
            if Path(basename).name == basename and Path(basename).suffix == '.pdf':
                uuid.UUID(Path(basename).stem)
                (UPLOAD_DIR / basename).unlink(missing_ok=True)
        except ValueError:
            pass


async def save_pdf(file: UploadFile) -> tuple[str, str]:
    original = Path(file.filename or 'submission.pdf').name[:255]
    if not original.lower().endswith('.pdf'):
        raise HTTPException(422, 'Only PDF files are accepted')
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, 'PDF exceeds 10 MB limit')
    if not data.startswith(b'%PDF-'):
        raise HTTPException(422, 'Invalid PDF header')
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    basename = f'{uuid.uuid4()}.pdf'
    (UPLOAD_DIR / basename).write_bytes(data)
    return basename, original


def file_response(basename: str, original: str) -> FileResponse:
    path = UPLOAD_DIR / basename
    if not path.is_file():
        raise HTTPException(404, 'PDF file missing from storage')
    return FileResponse(path, media_type='application/pdf', filename=original)


@router.post('/courses/{course_id}/assignments', response_model=AssignmentOut, status_code=201)
def create_assignment(course_id: int, body: AssignmentCreate,
                      user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    require_course(course_id, user, db, edit=True)
    a = Assignment(course_id=course_id, title=body.title, description=body.description,
                   due_at=as_utc(body.dueAt), max_points=body.maxPoints, submission_type=body.submissionType)
    db.add(a); db.commit(); db.refresh(a)
    return out_assignment(a, user, db)


@router.get('/courses/{course_id}/assignments', response_model=list[AssignmentOut])
def list_assignments(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require_course(course_id, user, db)
    assignments = db.scalars(select(Assignment).where(Assignment.course_id == course_id)
                             .order_by(Assignment.due_at, Assignment.id)).all()
    return [out_assignment(a, user, db) for a in assignments]


@router.get('/assignments/{assignment_id}', response_model=AssignmentOut)
def assignment_detail(assignment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return out_assignment(require_assignment(assignment_id, user, db), user, db)


@router.patch('/assignments/{assignment_id}', response_model=AssignmentOut)
def edit_assignment(assignment_id: int, body: AssignmentUpdate,
                    user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db, edit=True)
    updates = body.model_dump(exclude_unset=True)
    if 'maxPoints' in updates:
        top = db.scalars(select(AssignmentSubmission.points_earned).where(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.points_earned.is_not(None),
        )).all()
        if top and max(top) > body.maxPoints:
            raise HTTPException(409, 'New maximum is below an existing grade')
    if 'submissionType' in updates:
        rows = db.scalars(select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == a.id, AssignmentSubmission.submitted_at.is_not(None)
        )).all()
        if any(body.submissionType not in ('BOTH', s.submission_type) for s in rows):
            raise HTTPException(409, 'Submission type conflicts with submitted work')
    fields = {'title': 'title', 'description': 'description', 'dueAt': 'due_at',
              'maxPoints': 'max_points', 'submissionType': 'submission_type'}
    for key, value in updates.items():
        if value is None:
            raise HTTPException(422, f'{key} cannot be null')
        setattr(a, fields[key], as_utc(value) if key == 'dueAt' else value)
    db.commit(); db.refresh(a)
    return out_assignment(a, user, db)


@router.delete('/assignments/{assignment_id}', status_code=204)
def delete_assignment(assignment_id: int, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db, edit=True)
    rows = db.scalars(select(AssignmentSubmission).where(AssignmentSubmission.assignment_id == a.id)).all()
    paths = [s.file_path for s in rows]
    paths.append(a.instructions_file)
    for s in rows:
        db.delete(s)
    db.flush()
    db.delete(a); db.commit()
    for path in paths:
        delete_file(path)


@router.post('/assignments/{assignment_id}/instructions', response_model=AssignmentOut)
async def upload_instructions(assignment_id: int, file: UploadFile = File(...),
                              user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db, edit=True)
    path, name = await save_pdf(file)
    old = a.instructions_file
    a.instructions_file = path; a.instructions_filename = name
    try:
        db.commit()
    except Exception:
        delete_file(path)
        raise
    delete_file(old)
    return out_assignment(a, user, db)


@router.get('/assignments/{assignment_id}/instructions')
def download_instructions(assignment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db)
    if not a.instructions_file:
        raise HTTPException(404, 'No instructions PDF')
    return file_response(a.instructions_file, a.instructions_filename or 'instructions.pdf')


def require_student(user: User):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')


def save_submission(a: Assignment, user: User, db: Session, kind: str, text: str | None,
                    file_path: str | None, filename: str | None):
    require_student(user)
    s = get_submission(a.id, user.id, db)
    old_file = s.file_path if s else None
    if s is None:
        s = AssignmentSubmission(assignment_id=a.id, student_id=user.id)
        db.add(s)
    s.submission_type = kind
    s.text_content = text
    s.file_path = file_path
    s.original_filename = filename
    s.submitted_at = now()
    # A resubmission requires fresh instructor grading.
    s.points_earned = None
    s.feedback = ''
    s.graded_at = None
    s.graded_by = None
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Please retry submission') from None
    except Exception:
        db.rollback()
        raise
    db.refresh(s)
    if old_file and old_file != file_path:
        delete_file(old_file)
    return out_submission(s, a, db)


@router.put('/assignments/{assignment_id}/submission/text', response_model=AssignmentSubmissionOut)
def submit_text(assignment_id: int, body: TextBody, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require_student(user)
    a = require_assignment(assignment_id, user, db)
    if a.submission_type not in ('TEXT', 'BOTH'):
        raise HTTPException(422, 'Text submissions not enabled')
    return save_submission(a, user, db, 'TEXT', body.text, None, None)


@router.put('/assignments/{assignment_id}/submission/pdf', response_model=AssignmentSubmissionOut)
async def submit_pdf(assignment_id: int, file: UploadFile = File(...),
                     user: User = Depends(current_user), db: Session = Depends(get_db)):
    require_student(user)
    a = require_assignment(assignment_id, user, db)
    if a.submission_type not in ('PDF', 'BOTH'):
        raise HTTPException(422, 'PDF submissions not enabled')
    path, name = await save_pdf(file)
    try:
        return save_submission(a, user, db, 'PDF', None, path, name)
    except Exception:
        delete_file(path)
        raise


@router.get('/assignments/{assignment_id}/submission', response_model=AssignmentSubmissionOut | None)
def own_submission(assignment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    require_student(user)
    a = require_assignment(assignment_id, user, db)
    s = get_submission(a.id, user.id, db)
    return out_submission(s, a, db) if s else None


@router.get('/assignments/{assignment_id}/submissions', response_model=list[AssignmentSubmissionOut])
def list_submissions(assignment_id: int, user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db, edit=True)
    students = db.scalars(select(User).join(Enrollment, User.id == Enrollment.student_id).where(
        Enrollment.course_id == a.course_id, User.role == 'STUDENT').order_by(User.name, User.id)).all()
    result = []
    for student in students:
        s = get_submission(a.id, student.id, db)
        if s:
            result.append(out_submission(s, a, db))
        else:
            result.append(AssignmentSubmissionOut(id=0, assignmentId=a.id, studentId=student.id,
                studentName=student.name, submissionType=None, text=None, filename=None,
                submittedAt=None, late=False, pointsEarned=None, percentage=None,
                feedback='', gradedAt=None))
    return result


@router.put('/assignments/{assignment_id}/students/{student_id}/grade', response_model=AssignmentSubmissionOut)
def grade_assignment(assignment_id: int, student_id: int, body: GradeBody,
                     user: User = Depends(require_instructor), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db, edit=True)
    if body.pointsEarned > a.max_points:
        raise HTTPException(422, 'Grade exceeds maximum points')
    student = db.get(User, student_id)
    enrolled = db.scalar(select(Enrollment.id).where(Enrollment.course_id == a.course_id,
                                                    Enrollment.student_id == student_id))
    if not student or student.role != 'STUDENT' or enrolled is None:
        raise HTTPException(404, 'Student not enrolled in course')
    s = get_submission(a.id, student_id, db)
    if s is None:
        s = AssignmentSubmission(assignment_id=a.id, student_id=student_id)
        db.add(s)
    s.points_earned = body.pointsEarned
    s.feedback = body.feedback
    s.graded_at = now()
    s.graded_by = user.id
    db.commit(); db.refresh(s)
    return out_submission(s, a, db)


@router.get('/assignments/{assignment_id}/students/{student_id}/pdf')
def download_submission(assignment_id: int, student_id: int,
                        user: User = Depends(current_user), db: Session = Depends(get_db)):
    a = require_assignment(assignment_id, user, db)
    if user.role == 'STUDENT' and user.id != student_id:
        raise HTTPException(403, 'Cannot access another student submission')
    s = get_submission(a.id, student_id, db)
    if not s or not s.file_path:
        raise HTTPException(404, 'No submitted PDF')
    return file_response(s.file_path, s.original_filename or 'submission.pdf')
