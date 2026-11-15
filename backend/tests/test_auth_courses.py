from app.models import Course, Enrollment, User
from sqlalchemy import select


def test_login_and_me(client, scenario):
    login = client.post('/api/auth/login', json={
        'email': 'one@demo.test', 'password': scenario['password'],
    })
    assert login.status_code == 200
    data = login.json()
    assert data['token_type'] == 'bearer'
    assert data['user']['role'] == 'INSTRUCTOR'
    assert data['access_token']
    me = client.get('/api/auth/me', headers={'Authorization': f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()['email'] == 'one@demo.test'
    assert 'password_hash' not in me.json()


def test_wrong_password_and_unknown_user(client, scenario):
    for email in ('one@demo.test', 'missing@demo.test'):
        res = client.post('/api/auth/login', json={'email': email, 'password': 'incorrect'})
        assert res.status_code == 401


def test_authentication_required_and_invalid_token(client, scenario):
    assert client.get('/api/auth/me').status_code == 401
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer bad.jwt.token'}).status_code == 401
    assert client.get('/api/courses').status_code == 401


def test_student_cannot_create_course(client, scenario, auth):
    res = client.post('/api/courses', json={'name': 'Forbidden'}, headers=auth('student1@demo.test'))
    assert res.status_code == 403


def test_course_creation_and_ownership(client, scenario, auth):
    res = client.post('/api/courses', json={'name': 'Software Engineering', 'description': 'Practice'},
                      headers=auth('one@demo.test'))
    assert res.status_code == 201
    course = res.json()
    assert course['name'] == 'Software Engineering'
    assert course['studentIds'] == []
    assert course['instructorId'] == scenario['users']['one@demo.test']
    assert client.get(f"/api/courses/{course['id']}", headers=auth('two@demo.test')).status_code == 403
    assert client.get('/api/courses', headers=auth('one@demo.test')).status_code == 200
    assert client.get('/api/courses/999999', headers=auth('one@demo.test')).status_code == 404


def test_course_lists_are_private(client, scenario, auth):
    cid = scenario['course_id']
    own = client.get('/api/courses', headers=auth('student1@demo.test'))
    assert own.status_code == 200
    assert [c['id'] for c in own.json()] == [cid]
    unregistered = client.get('/api/courses', headers=auth('student3@demo.test'))
    assert unregistered.status_code == 200
    assert unregistered.json() == []
    assert client.get(f'/api/courses/{cid}', headers=auth('student3@demo.test')).status_code == 403


def test_enroll_student_and_idempotency(client, scenario, auth, db):
    cid = scenario['course_id']
    path = f'/api/courses/{cid}/enrollments'
    headers = auth('one@demo.test')
    for _ in range(2):
        res = client.post(path, json={'email': 'student3@demo.test'}, headers=headers)
        assert res.status_code == 200, res.text
        assert scenario['users']['student3@demo.test'] in res.json()['studentIds']
    count = db.scalars(select(Enrollment).where(Enrollment.course_id == cid,
              Enrollment.student_id == scenario['users']['student3@demo.test'])).all()
    assert len(count) == 1
    assert client.post(path, json={'email': 'student2@demo.test'},
                       headers=auth('student1@demo.test')).status_code == 403
    assert client.post(path, json={'email': 'one@demo.test'}, headers=headers).status_code == 404
    assert client.post(path, json={'email': 'missing@demo.test'}, headers=headers).status_code == 404
    assert client.post(path, json={'email': 'student1@demo.test'},
                       headers=auth('two@demo.test')).status_code == 403


def test_course_edit_requires_ownership_and_persists(client, scenario, auth, db):
    cid = scenario['course_id']
    path = f'/api/courses/{cid}'
    payload = {'name': '  Advanced Networks  ', 'description': 'Updated course description.'}
    assert client.patch(path, json=payload).status_code == 401
    assert client.patch(path, json=payload, headers=auth('student1@demo.test')).status_code == 403
    assert client.patch(path, json=payload, headers=auth('two@demo.test')).status_code == 403
    response = client.patch(path, json=payload, headers=auth('one@demo.test'))
    assert response.status_code == 200, response.text
    assert response.json()['name'] == 'Advanced Networks'
    assert response.json()['description'] == 'Updated course description.'
    assert client.get(path, headers=auth('student1@demo.test')).json()['name'] == 'Advanced Networks'
    invalid = client.patch(path, json={'name': '   ', 'description': 'bad'}, headers=auth('one@demo.test'))
    assert invalid.status_code == 422
    assert client.get(path, headers=auth('one@demo.test')).json()['description'] == 'Updated course description.'
