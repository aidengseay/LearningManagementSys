from contextlib import asynccontextmanager

from email_validator import EmailNotValidError, validate_email
from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, make_token, require_instructor, verify_password
from app.database import Base, check_database, engine
from app.models import Course, Enrollment, User  # registers models before create_all
from app.seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Development-only table creation; use Alembic migrations later.
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield


app = FastAPI(title='Learning Management System', version='0.2.0', lifespan=lifespan)


def normalized_email(value: str) -> str:
    """Validate an address while permitting RFC-reserved local demo domains."""
    try:
        result = validate_email(
            value,
            check_deliverability=False,
            test_environment=True,
        )
    except EmailNotValidError as exc:
        raise ValueError(str(exc)) from exc
    return result.normalized.lower()


class EmailBody(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email_address(cls, value: str) -> str:
        return normalized_email(value)


class LoginBody(EmailBody):
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class LoginOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserOut


class CourseBody(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ''


class CourseOut(BaseModel):
    id: int
    name: str
    description: str
    instructorId: int
    studentIds: list[int]


class EnrollmentBody(EmailBody):
    pass


def visible_course(course: Course, db: Session) -> CourseOut:
    ids = db.scalars(select(Enrollment.student_id).where(Enrollment.course_id == course.id)).all()
    return CourseOut(id=course.id, name=course.name, description=course.description,
                     instructorId=course.instructor_id, studentIds=list(ids))


def get_authorized_course(course_id: int, user: User, db: Session) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, detail='Course not found')
    if user.role == 'INSTRUCTOR' and course.instructor_id == user.id:
        return course
    if user.role == 'STUDENT' and db.scalar(select(Enrollment.id).where(
        Enrollment.course_id == course_id, Enrollment.student_id == user.id)) is not None:
        return course
    raise HTTPException(403, detail='Not enrolled in this course')


@app.get('/api')
def root():
    return {'message': 'LMS API is running'}


@app.get('/api/health')
def health():
    try:
        check_database()
        return {'status': 'healthy', 'database': 'connected'}
    except Exception:
        raise HTTPException(503, detail='Database unavailable') from None


@app.post('/api/auth/login', response_model=LoginOut)
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    return LoginOut(access_token=make_token(user), user=UserOut.model_validate(user))


@app.get('/api/auth/me', response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@app.get('/api/courses', response_model=list[CourseOut])
def list_courses(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.role == 'INSTRUCTOR':
        courses = db.scalars(select(Course).where(Course.instructor_id == user.id).order_by(Course.id)).all()
    else:
        courses = db.scalars(select(Course).join(Enrollment).where(
            Enrollment.student_id == user.id).order_by(Course.id)).all()
    return [visible_course(course, db) for course in courses]


@app.post('/api/courses', response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(body: CourseBody, instructor: User = Depends(require_instructor),
                  db: Session = Depends(get_db)):
    course = Course(name=body.name.strip(), description=body.description,
                    instructor_id=instructor.id)
    if not course.name:
        raise HTTPException(422, detail='Course name cannot be blank')
    db.add(course)
    db.commit()
    db.refresh(course)
    return visible_course(course, db)


@app.get('/api/courses/{course_id}', response_model=CourseOut)
def get_course(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return visible_course(get_authorized_course(course_id, user, db), db)


@app.post('/api/courses/{course_id}/enrollments', response_model=CourseOut)
def enroll(course_id: int, body: EnrollmentBody,
           instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    course = get_authorized_course(course_id, instructor, db)
    student = db.scalar(select(User).where(User.email == body.email))
    if student is None or student.role != 'STUDENT':
        raise HTTPException(404, detail='Student not found')
    existing = db.scalar(select(Enrollment.id).where(
        Enrollment.course_id == course_id, Enrollment.student_id == student.id))
    if existing is None:
        db.add(Enrollment(course_id=course_id, student_id=student.id))
        db.commit()
    return visible_course(course, db)
