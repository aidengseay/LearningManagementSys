"""Create the local demo accounts and starter course.

This is safe to run repeatedly. The FastAPI lifespan calls it when both demo
passwords are configured, and it can also be run manually with
``docker compose exec backend python -m app.seed``.
"""
import os

from sqlalchemy import select

from app.auth import hash_password, verify_password
from app.database import Base, SessionLocal, engine
from app.models import Course, Enrollment, User


def seed_demo_data() -> bool:
    """Seed configured demo data and return whether seeding was performed."""
    student_password = os.environ.get('DEMO_STUDENT_PASSWORD')
    instructor_password = os.environ.get('DEMO_INSTRUCTOR_PASSWORD')
    if not student_password or not instructor_password:
        return False

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        def ensure_user(name, email, role, password):
            person = db.scalar(select(User).where(User.email == email))
            if person:
                if person.role != role:
                    raise RuntimeError(f'Existing account has wrong role: {email}')
                # Keep the documented local credentials in sync when .env is
                # changed while the PostgreSQL volume is preserved.
                if not verify_password(password, person.password_hash):
                    person.password_hash = hash_password(password)
                return person
            person = User(name=name, email=email, role=role, password_hash=hash_password(password))
            db.add(person)
            db.flush()
            return person
        student = ensure_user('Alex Student', 'student@demo.test', 'STUDENT', student_password)
        instructor = ensure_user('Jordan Instructor', 'instructor@demo.test', 'INSTRUCTOR', instructor_password)
        course = db.scalar(select(Course).where(Course.name == 'Computer Networks', Course.instructor_id == instructor.id))
        if not course:
            course = Course(name='Computer Networks', description='Networking fundamentals and protocols', instructor_id=instructor.id)
            db.add(course)
            db.flush()
        enrolled = db.scalar(select(Enrollment.id).where(Enrollment.course_id == course.id, Enrollment.student_id == student.id))
        if enrolled is None:
            db.add(Enrollment(course_id=course.id, student_id=student.id))
        db.commit()
    return True


def main():
    if not seed_demo_data():
        raise SystemExit(
            'Set DEMO_STUDENT_PASSWORD and DEMO_INSTRUCTOR_PASSWORD in the '
            'root .env and backend environment.'
        )
    print('Demo accounts/course ready. Log in with the passwords from your .env.')


if __name__ == '__main__':
    main()
