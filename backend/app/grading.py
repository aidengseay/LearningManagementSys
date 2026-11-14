"""Point-based combined gradebook and coursework to-dos.

Existing quiz score/total remain raw question counts; max_points scales them
for the unified gradebook without mutating prior submissions.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import inspect, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, require_instructor
from app.models import Assignment, AssignmentSubmission, Course, Enrollment, Question, Quiz, QuizSubmission, User
from app.assignments import require_course, get_submission, as_utc

router = APIRouter(prefix='/api', tags=['Unified grading'])


def migrate_quiz_points(engine: Engine):
    """Add points column for legacy quiz tables without removing existing records.

    For preexisting quizzes, backfill points from question count. New quizzes can
    choose their point value. Run before ORM queries; SQLite supports this too.
    """
    inspector = inspect(engine)
    if 'quizzes' not in inspector.get_table_names():
        return
    names = {col['name'] for col in inspector.get_columns('quizzes')}
    with engine.begin() as conn:
        if 'max_points' not in names:
            conn.execute(text('ALTER TABLE quizzes ADD COLUMN max_points INTEGER'))
        conn.execute(text('''UPDATE quizzes SET max_points = (
            SELECT COUNT(*) FROM questions WHERE questions.quiz_id = quizzes.id
        ) WHERE max_points IS NULL'''))


class GradeItem(BaseModel):
    type: str
    id: int
    title: str
    due: str
    earned: float | None
    possible: int
    percentage: float | None
    status: str
    submittedAt: datetime | None
    feedback: str | None = None


class StudentReport(BaseModel):
    studentId: int
    studentName: str
    studentEmail: str
    grades: list[GradeItem]
    earnedPoints: float
    possiblePoints: int
    overallPercentage: float | None


class UnifiedGradebook(BaseModel):
    courseId: int
    students: list[StudentReport]


class UnifiedTodo(BaseModel):
    type: str
    id: int
    courseId: int
    courseName: str
    title: str
    due: str
    overdue: bool


def get_student_grades(course_id: int, student: User, db: Session) -> StudentReport:
    quizzes = db.scalars(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.due_date, Quiz.id)).all()
    assignments = db.scalars(select(Assignment).where(Assignment.course_id == course_id)
                             .order_by(Assignment.due_at, Assignment.id)).all()
    grades = []
    earned_sum = 0.0
    possible_sum = 0
    for q in quizzes:
        sub = db.scalar(select(QuizSubmission).where(QuizSubmission.quiz_id == q.id,
                                                     QuizSubmission.student_id == student.id))
        raw_total = db.scalars(select(Question.id).where(Question.quiz_id == q.id)).all()
        max_points = q.max_points if q.max_points is not None else len(raw_total)
        earned = round(sub.score * max_points / sub.total, 4) if sub and sub.total else None
        if earned is not None:
            earned_sum += earned
            possible_sum += max_points
        grades.append(GradeItem(type='QUIZ', id=q.id, title=q.title, due=q.due_date.isoformat(),
                                earned=earned, possible=max_points,
                                percentage=round(earned / max_points * 100, 2) if earned is not None and max_points else None,
                                status='GRADED' if sub else 'NOT_SUBMITTED',
                                submittedAt=sub.submitted_at if sub else None))
    for a in assignments:
        s = get_submission(a.id, student.id, db)
        graded = s is not None and s.points_earned is not None
        if graded:
            earned_sum += s.points_earned
            possible_sum += a.max_points
        submitted = s is not None and s.submitted_at is not None
        late = bool(submitted and as_utc(s.submitted_at) > as_utc(a.due_at))
        missing = not submitted and as_utc(a.due_at) < datetime.now(timezone.utc)
        grades.append(GradeItem(type='ASSIGNMENT', id=a.id, title=a.title, due=as_utc(a.due_at).isoformat(),
                                earned=s.points_earned if graded else None, possible=a.max_points,
                                percentage=round(s.points_earned / a.max_points * 100, 2) if graded else None,
                                status=('GRADED' if graded else 'SUBMITTED' if submitted else 'MISSING' if missing else 'NOT_SUBMITTED'),
                                submittedAt=s.submitted_at if submitted else None,
                                feedback=s.feedback if s else None))
    grades.sort(key=lambda row: (row.due, row.type, row.id))
    return StudentReport(studentId=student.id, studentName=student.name,
                         studentEmail=student.email, grades=grades,
                         earnedPoints=round(earned_sum, 2), possiblePoints=possible_sum,
                         overallPercentage=round(earned_sum / possible_sum * 100, 2) if possible_sum else None)


@router.get('/courses/{course_id}/gradebook/unified', response_model=UnifiedGradebook)
def instructor_gradebook(course_id: int, instructor: User = Depends(require_instructor),
                         db: Session = Depends(get_db)):
    require_course(course_id, instructor, db, edit=True)
    students = db.scalars(select(User).join(Enrollment, User.id == Enrollment.student_id).where(
        Enrollment.course_id == course_id, User.role == 'STUDENT').order_by(User.name, User.id)).all()
    return UnifiedGradebook(courseId=course_id,
                            students=[get_student_grades(course_id, s, db) for s in students])


@router.get('/courses/{course_id}/my-grades/unified', response_model=StudentReport)
def my_grades(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    require_course(course_id, user, db)
    return get_student_grades(course_id, user, db)


@router.get('/todos/unified', response_model=list[UnifiedTodo])
def unified_todos(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    rows = db.scalars(select(Course).join(Enrollment, Enrollment.course_id == Course.id).where(
        Enrollment.student_id == user.id)).all()
    today = datetime.now(timezone.utc)
    items = []
    for course in rows:
        quizzes = db.scalars(select(Quiz).where(Quiz.course_id == course.id)).all()
        for q in quizzes:
            completed = db.scalar(select(QuizSubmission.id).where(
                QuizSubmission.quiz_id == q.id, QuizSubmission.student_id == user.id))
            if completed is None:
                # A date-only quiz deadline is interpreted as end of that date in UTC.
                due = datetime.combine(q.due_date, datetime.max.time(), tzinfo=timezone.utc)
                items.append(UnifiedTodo(type='QUIZ', id=q.id, courseId=course.id,
                                         courseName=course.name, title=q.title,
                                         due=q.due_date.isoformat(), overdue=due < today))
        assignments = db.scalars(select(Assignment).where(Assignment.course_id == course.id)).all()
        for a in assignments:
            s = get_submission(a.id, user.id, db)
            if not s or not s.submitted_at:
                items.append(UnifiedTodo(type='ASSIGNMENT', id=a.id, courseId=course.id,
                                         courseName=course.name, title=a.title,
                                         due=as_utc(a.due_at).isoformat(), overdue=as_utc(a.due_at) < today))
    return sorted(items, key=lambda item: (item.due, item.type, item.id))
