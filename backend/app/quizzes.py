"""PostgreSQL-backed quizzes, submissions, gradebook and student to-dos.

Answer choices are 0-based integers to match the existing React Question type.
"""
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, require_instructor
from app.models import Course, Enrollment, Question, Quiz, QuizAnswer, QuizSubmission, User

router = APIRouter(prefix='/api', tags=['Quizzes and grades'])


class QuestionCreate(BaseModel):
    text: str = Field(min_length=1)
    options: list[str] = Field(min_length=4, max_length=4)
    correct: int = Field(ge=0, le=3)

    @model_validator(mode='after')
    def nonempty(self):
        if not self.text.strip() or any(not o.strip() for o in self.options):
            raise ValueError('Question and all choices must contain text')
        return self


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due: date
    questions: list[QuestionCreate] = Field(min_length=1)
    maxPoints: int | None = Field(default=None, gt=0)

    @model_validator(mode='after')
    def nonempty(self):
        if not self.title.strip():
            raise ValueError('Quiz title cannot be blank')
        return self


class QuestionPublic(BaseModel):
    id: int
    text: str
    options: list[str]


class QuestionInstructor(QuestionPublic):
    correct: int


class QuizListItem(BaseModel):
    id: int
    courseId: int
    title: str
    due: date
    questionCount: int
    maxPoints: int
    submitted: bool | None = None
    score: int | None = None
    total: int | None = None


class QuizStudentDetail(BaseModel):
    id: int
    courseId: int
    title: str
    due: date
    questions: list[QuestionPublic]
    maxPoints: int


class QuizInstructorDetail(BaseModel):
    id: int
    courseId: int
    title: str
    due: date
    questions: list[QuestionInstructor]
    maxPoints: int


class SubmitBody(BaseModel):
    # The dictionary keys are the database question IDs as JSON strings.
    answers: dict[int, int] = Field(min_length=1)

    @model_validator(mode='after')
    def choices_valid(self):
        if any(x < 0 or x > 3 for x in self.answers.values()):
            raise ValueError('Answer choices must be integers 0–3')
        return self


class SubmissionOut(BaseModel):
    id: int
    quizId: int
    studentId: int
    score: int
    total: int
    percentage: float
    submittedAt: datetime
    answers: dict[int, int]


class GradeEntry(BaseModel):
    quizId: int
    quizTitle: str
    due: date
    score: int | None
    total: int
    percentage: float | None
    submittedAt: datetime | None


class StudentGrades(BaseModel):
    studentId: int
    studentName: str
    studentEmail: str
    grades: list[GradeEntry]
    averagePercentage: float | None


class GradebookOut(BaseModel):
    courseId: int
    students: list[StudentGrades]


class TodoItem(BaseModel):
    quizId: int
    courseId: int
    courseName: str
    title: str
    due: date
    overdue: bool


def _course(course_id: int, user: User, db: Session) -> Course:
    obj = db.get(Course, course_id)
    if obj is None:
        raise HTTPException(404, 'Course not found')
    if user.role == 'INSTRUCTOR' and obj.instructor_id == user.id:
        return obj
    if user.role == 'STUDENT' and db.scalar(select(Enrollment.id).where(
        Enrollment.course_id == course_id, Enrollment.student_id == user.id
    )) is not None:
        return obj
    raise HTTPException(403, 'Not authorized for this course')


def _quiz(quiz_id: int, user: User, db: Session) -> Quiz:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(404, 'Quiz not found')
    _course(quiz.course_id, user, db)
    return quiz


def _questions(quiz_id: int, db: Session) -> list[Question]:
    return list(db.scalars(select(Question).where(Question.quiz_id == quiz_id).order_by(Question.position)))


def _public_question(q: Question, instructor: bool):
    fields = {'id': q.id, 'text': q.text,
              'options': [q.option_a, q.option_b, q.option_c, q.option_d]}
    if instructor:
        fields['correct'] = q.correct
    return fields


def _submission_out(sub: QuizSubmission, db: Session) -> SubmissionOut:
    answers = db.scalars(select(QuizAnswer).where(QuizAnswer.submission_id == sub.id)).all()
    return SubmissionOut(id=sub.id, quizId=sub.quiz_id, studentId=sub.student_id,
                         score=sub.score, total=sub.total,
                         percentage=round(sub.score * 100 / sub.total, 2),
                         submittedAt=sub.submitted_at,
                         answers={a.question_id: a.selected for a in answers})


@router.post('/courses/{course_id}/quizzes', status_code=status.HTTP_201_CREATED,
             response_model=QuizInstructorDetail)
def create_quiz(course_id: int, body: QuizCreate,
                instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    _course(course_id, instructor, db)
    quiz = Quiz(course_id=course_id, title=body.title.strip(), due_date=body.due,
                max_points=body.maxPoints or len(body.questions))
    db.add(quiz)
    db.flush()
    for position, data in enumerate(body.questions):
        db.add(Question(quiz_id=quiz.id, position=position, text=data.text,
                        option_a=data.options[0], option_b=data.options[1],
                        option_c=data.options[2], option_d=data.options[3],
                        correct=data.correct))
    db.commit()
    return get_quiz(quiz.id, instructor, db)


@router.get('/courses/{course_id}/quizzes', response_model=list[QuizListItem])
def list_quizzes(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    _course(course_id, user, db)
    quizzes = db.scalars(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.due_date, Quiz.id)).all()
    result = []
    for quiz in quizzes:
        total = len(_questions(quiz.id, db))
        sub = (db.scalar(select(QuizSubmission).where(
            QuizSubmission.quiz_id == quiz.id, QuizSubmission.student_id == user.id))
            if user.role == 'STUDENT' else None)
        result.append(QuizListItem(id=quiz.id, courseId=course_id, title=quiz.title,
                                   due=quiz.due_date, questionCount=total, maxPoints=quiz.max_points or total,
                                   submitted=(sub is not None) if user.role == 'STUDENT' else None,
                                   score=sub.score if sub else None, total=sub.total if sub else None))
    return result


@router.get('/quizzes/{quiz_id}', response_model=QuizStudentDetail | QuizInstructorDetail)
def get_quiz(quiz_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    quiz = _quiz(quiz_id, user, db)
    instructor = user.role == 'INSTRUCTOR'
    payload = {'id': quiz.id, 'courseId': quiz.course_id, 'title': quiz.title,
               'due': quiz.due_date, 'maxPoints': quiz.max_points or len(_questions(quiz.id, db)),
               'questions': [_public_question(q, instructor) for q in _questions(quiz.id, db)]}
    return QuizInstructorDetail(**payload) if instructor else QuizStudentDetail(**payload)


@router.post('/quizzes/{quiz_id}/submissions', status_code=status.HTTP_201_CREATED,
             response_model=SubmissionOut)
def submit_quiz(quiz_id: int, body: SubmitBody, user: User = Depends(current_user),
                db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    _quiz(quiz_id, user, db)
    questions = _questions(quiz_id, db)
    expected = {q.id for q in questions}
    if set(body.answers) != expected:
        raise HTTPException(422, 'Submit exactly one answer for every question in the quiz')
    if db.scalar(select(QuizSubmission.id).where(
        QuizSubmission.quiz_id == quiz_id, QuizSubmission.student_id == user.id)) is not None:
        raise HTTPException(409, 'Quiz has already been submitted')
    score = sum(body.answers[q.id] == q.correct for q in questions)
    sub = QuizSubmission(quiz_id=quiz_id, student_id=user.id, score=score, total=len(questions))
    try:
        db.add(sub)
        db.flush()
        for q in questions:
            db.add(QuizAnswer(submission_id=sub.id, question_id=q.id,
                              selected=body.answers[q.id], is_correct=body.answers[q.id] == q.correct))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Quiz has already been submitted') from None
    db.refresh(sub)
    return _submission_out(sub, db)


@router.get('/quizzes/{quiz_id}/submission', response_model=SubmissionOut | None)
def my_submission(quiz_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    _quiz(quiz_id, user, db)
    sub = db.scalar(select(QuizSubmission).where(
        QuizSubmission.quiz_id == quiz_id, QuizSubmission.student_id == user.id))
    return _submission_out(sub, db) if sub else None


def _grades_for_student(course_quizzes: list[Quiz], student: User, db: Session) -> StudentGrades:
    grades = []
    percentages = []
    for q in course_quizzes:
        sub = db.scalar(select(QuizSubmission).where(
            QuizSubmission.quiz_id == q.id, QuizSubmission.student_id == student.id))
        total = len(_questions(q.id, db))
        pct = round(sub.score * 100 / sub.total, 2) if sub else None
        if pct is not None:
            percentages.append(pct)
        grades.append(GradeEntry(quizId=q.id, quizTitle=q.title, due=q.due_date,
                                 score=sub.score if sub else None, total=total,
                                 percentage=pct, submittedAt=sub.submitted_at if sub else None))
    return StudentGrades(studentId=student.id, studentName=student.name, studentEmail=student.email,
                         grades=grades,
                         averagePercentage=round(sum(percentages)/len(percentages), 2) if percentages else None)


@router.get('/courses/{course_id}/gradebook', response_model=GradebookOut)
def course_gradebook(course_id: int, instructor: User = Depends(require_instructor),
                     db: Session = Depends(get_db)):
    _course(course_id, instructor, db)
    students = db.scalars(select(User).join(Enrollment, Enrollment.student_id == User.id).where(
        Enrollment.course_id == course_id).order_by(User.name, User.id)).all()
    quizzes = list(db.scalars(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.due_date, Quiz.id)))
    return GradebookOut(courseId=course_id, students=[_grades_for_student(quizzes, student, db) for student in students])


@router.get('/courses/{course_id}/my-grades', response_model=StudentGrades)
def my_grades(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    _course(course_id, user, db)
    quizzes = list(db.scalars(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.due_date, Quiz.id)))
    return _grades_for_student(quizzes, user, db)


@router.get('/todos', response_model=list[TodoItem])
def my_todos(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != 'STUDENT':
        raise HTTPException(403, 'Student access required')
    rows = db.execute(select(Quiz, Course).join(Course, Quiz.course_id == Course.id)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .where(Enrollment.student_id == user.id)
        .order_by(Quiz.due_date, Quiz.id)).all()
    done_ids = set(db.scalars(select(QuizSubmission.quiz_id).where(QuizSubmission.student_id == user.id)))
    today = date.today()
    return [TodoItem(quizId=q.id, courseId=c.id, courseName=c.name,
                     title=q.title, due=q.due_date, overdue=q.due_date < today)
            for q, c in rows if q.id not in done_ids]
