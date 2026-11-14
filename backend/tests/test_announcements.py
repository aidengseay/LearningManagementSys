

def test_instructor_creates_student_reads_announcements(client, scenario, auth):
    cid = scenario['course_id']
    path = f'/api/courses/{cid}/announcements'
    first = client.post(path, json={'title': 'Exam reminder', 'content': 'Review chapter 4'},
                        headers=auth('one@demo.test'))
    assert first.status_code == 201, first.text
    data = first.json()
    assert data['courseId'] == cid
    assert data['title'] == 'Exam reminder'
    assert data['content'] == 'Review chapter 4'
    assert 'createdAt' in data
    for email in ('one@demo.test', 'student1@demo.test', 'student2@demo.test'):
        response = client.get(path, headers=auth(email))
        assert response.status_code == 200
        assert response.json()[0]['id'] == data['id']


def test_announcement_permissions(client, scenario, auth):
    cid = scenario['course_id']
    path = f'/api/courses/{cid}/announcements'
    body = {'title': 'Message', 'content': 'Contents'}
    assert client.post(path, json=body).status_code == 401
    assert client.get(path).status_code == 401
    for email in ('student1@demo.test', 'two@demo.test', 'student3@demo.test'):
        assert client.post(path, json=body, headers=auth(email)).status_code == 403
    assert client.get(path, headers=auth('student3@demo.test')).status_code == 403
    assert client.get(path, headers=auth('two@demo.test')).status_code == 403
    assert client.get('/api/courses/999999/announcements', headers=auth('one@demo.test')).status_code == 404


def test_announcement_validates_body(client, scenario, auth):
    path = f"/api/courses/{scenario['course_id']}/announcements"
    headers = auth('one@demo.test')
    for body in (
        {'title': '', 'content': 'Hello'},
        {'title': ' ', 'content': 'Hello'},
        {'title': 'Hello', 'content': ' '},
        {'title': 'Hello', 'content': ''},
    ):
        assert client.post(path, json=body, headers=headers).status_code == 422


def test_announcements_isolated_across_courses(client, scenario, auth):
    own_path = f"/api/courses/{scenario['course_id']}/announcements"
    other_path = f"/api/courses/{scenario['other_course_id']}/announcements"
    assert client.post(own_path, json={'title': 'Own course', 'content': 'One'},
                       headers=auth('one@demo.test')).status_code == 201
    assert client.post(other_path, json={'title': 'Other course', 'content': 'Two'},
                       headers=auth('two@demo.test')).status_code == 201
    assert [a['title'] for a in client.get(own_path, headers=auth('student1@demo.test')).json()] == ['Own course']
    assert client.get(other_path, headers=auth('student1@demo.test')).status_code == 403
