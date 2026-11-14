"""Isolated integration-test fixtures for the existing FastAPI application.

Tests call the real API routes through TestClient, with get_db overridden to
use a fresh in-memory SQLite database per test. They intentionally do not enter
TestClient's lifespan context: main.py's development startup otherwise seeds
and creates tables in the configured PostgreSQL database.
"""
import os

# The app's database and auth modules read these environment variables on import.
# These are deliberately test-only values, not real credentials.
os.environ.setdefault('POSTGRES_USER', 'test')
os.environ.setdefault('POSTGRES_PASSWORD', 'test')
os.environ.setdefault('POSTGRES_DB', 'test')
os.environ.setdefault('JWT_SECRET_KEY', 'automated-test-only-secret-not-for-deployment')
os.environ.setdefault('JWT_ALGORITHM', 'HS256')

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_db, hash_password
from app.database import Base
from app.main import app
from app.models import Course, Enrollment, User  # imports all mapped tables


@pytest.fixture
def db():
    engine = create_engine(
        'sqlite+pysqlite://',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db):
    def override_get_db():
        # Every request gets its own database session but shares the same test DB.
        with Session(db.get_bind()) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        # Do not use `with TestClient(app)`: that would trigger live DB seeding.
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def scenario(db):
    """Two instructors, two enrolled students, and one unenrolled student."""
    password = 'TestPassword123!'
    users = [
        User(name='Instructor One', email='one@demo.test', role='INSTRUCTOR', password_hash=hash_password(password)),
        User(name='Instructor Two', email='two@demo.test', role='INSTRUCTOR', password_hash=hash_password(password)),
        User(name='Student One', email='student1@demo.test', role='STUDENT', password_hash=hash_password(password)),
        User(name='Student Two', email='student2@demo.test', role='STUDENT', password_hash=hash_password(password)),
        User(name='Student Three', email='student3@demo.test', role='STUDENT', password_hash=hash_password(password)),
    ]
    db.add_all(users)
    db.flush()
    first = Course(name='Computer Networks', description='Networking class', instructor_id=users[0].id)
    second = Course(name='Other Class', description='Other instructor', instructor_id=users[1].id)
    db.add_all([first, second]); db.flush()
    db.add_all([
        Enrollment(course_id=first.id, student_id=users[2].id),
        Enrollment(course_id=first.id, student_id=users[3].id),
    ])
    db.commit()
    return {
        'password': password,
        'course_id': first.id,
        'other_course_id': second.id,
        'users': {u.email: u.id for u in users},
    }


@pytest.fixture
def auth(client, scenario):
    def headers(email, password=None):
        response = client.post('/api/auth/login', json={
            'email': email,
            'password': password if password is not None else scenario['password'],
        })
        assert response.status_code == 200, response.text
        return {'Authorization': f"Bearer {response.json()['access_token']}"}
    return headers


@pytest.fixture
def quiz_payload():
    return {
        'title': 'Routing protocols',
        'due': '2026-12-01',
        'questions': [
            {'text': 'Which is a distance-vector routing protocol?',
             'options': ['OSPF', 'RIP', 'ARP', 'ICMP'], 'correct': 1},
            {'text': 'Which protocol resolves IPv4 addresses to link-layer addresses?',
             'options': ['TCP', 'UDP', 'ARP', 'BGP'], 'correct': 2},
        ],
    }


@pytest.fixture
def created_quiz(client, scenario, auth, quiz_payload):
    response = client.post(
        f"/api/courses/{scenario['course_id']}/quizzes",
        json=quiz_payload,
        headers=auth('one@demo.test'),
    )
    assert response.status_code == 201, response.text
    return response.json()
