from datetime import date, timedelta


def test_quiz_creation_and_student_answer_key_protection(client, scenario, auth, created_quiz):
    cid = scenario['course_id']
    qid = created_quiz['id']
    assert len(created_quiz['questions']) == 2
    assert created_quiz['questions'][0]['correct'] == 1
    student = client.get(f'/api/quizzes/{qid}', headers=auth('student1@demo.test'))
    assert student.status_code == 200
    assert all('correct' not in q for q in student.json()['questions'])
    instructor = client.get(f'/api/quizzes/{qid}', headers=auth('one@demo.test'))
    assert instructor.status_code == 200
    assert [q['correct'] for q in instructor.json()['questions']] == [1, 2]
    listed = client.get(f'/api/courses/{cid}/quizzes', headers=auth('student1@demo.test'))
    assert listed.status_code == 200
    assert listed.json()[0]['submitted'] is False
    assert 'correct' not in str(listed.json())


def test_quiz_creation_restricted_to_owner(client, scenario, auth, quiz_payload):
    cid = scenario['course_id']
    for email in ('student1@demo.test', 'two@demo.test'):
        res = client.post(f'/api/courses/{cid}/quizzes', headers=auth(email), json=quiz_payload)
        assert res.status_code == 403
    assert client.get(f'/api/courses/{cid}/quizzes', headers=auth('student3@demo.test')).status_code == 403
    assert client.get('/api/quizzes/999999', headers=auth('student1@demo.test')).status_code == 404


def test_invalid_quiz_request_returns_422(client, scenario, auth, quiz_payload):
    cid = scenario['course_id']
    path = f'/api/courses/{cid}/quizzes'
    headers = auth('one@demo.test')
    for bad in (
        {**quiz_payload, 'questions': []},
        {**quiz_payload, 'questions': [{**quiz_payload['questions'][0], 'correct': 4}]},
        {**quiz_payload, 'questions': [{**quiz_payload['questions'][0], 'options': ['Only one']}]},
        {**quiz_payload, 'title': '   '},
    ):
        assert client.post(path, json=bad, headers=headers).status_code == 422


def test_submission_grading_and_persistence(client, scenario, auth, created_quiz):
    qid = created_quiz['id']
    q1, q2 = [q['id'] for q in created_quiz['questions']]
    before = client.get(f'/api/quizzes/{qid}/submission', headers=auth('student1@demo.test'))
    assert before.status_code == 200 and before.json() is None
    response = client.post(f'/api/quizzes/{qid}/submissions',
                           json={'answers': {str(q1): 1, str(q2): 0}},
                           headers=auth('student1@demo.test'))
    assert response.status_code == 201, response.text
    result = response.json()
    assert (result['score'], result['total'], result['percentage']) == (1, 2, 50.0)
    assert result['studentId'] == scenario['users']['student1@demo.test']
    assert result['answers'] == {str(q1): 1, str(q2): 0}
    saved = client.get(f'/api/quizzes/{qid}/submission', headers=auth('student1@demo.test'))
    assert saved.status_code == 200 and saved.json()['id'] == result['id']
    assert client.post(f'/api/quizzes/{qid}/submissions',
                       json={'answers': {str(q1): 1, str(q2): 0}},
                       headers=auth('student1@demo.test')).status_code == 409


def test_submission_validation_and_access(client, scenario, auth, created_quiz):
    qid = created_quiz['id']
    q1, q2 = [q['id'] for q in created_quiz['questions']]
    path = f'/api/quizzes/{qid}/submissions'
    student = auth('student1@demo.test')
    bad = (
        {'answers': {str(q1): 1}},
        {'answers': {str(q1): 1, str(q2): 2, '999999': 0}},
        {'answers': {str(q1): 4, str(q2): 2}},
        {'answers': {}},
    )
    for body in bad:
        assert client.post(path, json=body, headers=student).status_code == 422
    assert client.post(path, json={'answers': {str(q1): 1, str(q2): 2}},
                       headers=auth('one@demo.test')).status_code == 403
    assert client.post(path, json={'answers': {str(q1): 1, str(q2): 2}},
                       headers=auth('student3@demo.test')).status_code == 403
    assert client.get(f'/api/quizzes/{qid}/submission', headers=auth('student3@demo.test')).status_code == 403


def test_two_students_independent_grades_and_todos(client, scenario, auth, created_quiz):
    cid = scenario['course_id']
    qid = created_quiz['id']
    q1, q2 = [q['id'] for q in created_quiz['questions']]
    for email in ('student1@demo.test', 'student2@demo.test'):
        todos = client.get('/api/todos', headers=auth(email))
        assert todos.status_code == 200
        assert any(t['quizId'] == qid for t in todos.json())
    first = client.post(f'/api/quizzes/{qid}/submissions',
        json={'answers': {str(q1): 1, str(q2): 2}}, headers=auth('student1@demo.test'))
    assert first.status_code == 201 and first.json()['percentage'] == 100
    first_todos = client.get('/api/todos', headers=auth('student1@demo.test')).json()
    second_todos = client.get('/api/todos', headers=auth('student2@demo.test')).json()
    assert qid not in {t['quizId'] for t in first_todos}
    assert qid in {t['quizId'] for t in second_todos}
    second = client.post(f'/api/quizzes/{qid}/submissions',
        json={'answers': {str(q1): 0, str(q2): 0}}, headers=auth('student2@demo.test'))
    assert second.status_code == 201 and second.json()['percentage'] == 0
    own = client.get(f'/api/courses/{cid}/my-grades', headers=auth('student1@demo.test'))
    assert own.status_code == 200 and own.json()['averagePercentage'] == 100
    assert own.json()['studentId'] == scenario['users']['student1@demo.test']
    other = client.get(f'/api/courses/{cid}/my-grades', headers=auth('student2@demo.test'))
    assert other.status_code == 200 and other.json()['averagePercentage'] == 0
    gradebook = client.get(f'/api/courses/{cid}/gradebook', headers=auth('one@demo.test'))
    assert gradebook.status_code == 200
    entries = {s['studentEmail']: s for s in gradebook.json()['students']}
    assert entries['student1@demo.test']['averagePercentage'] == 100
    assert entries['student2@demo.test']['averagePercentage'] == 0
    assert client.get(f'/api/courses/{cid}/gradebook', headers=auth('student1@demo.test')).status_code == 403
    assert client.get(f'/api/courses/{cid}/gradebook', headers=auth('two@demo.test')).status_code == 403
    assert client.get(f'/api/courses/{cid}/my-grades', headers=auth('student3@demo.test')).status_code == 403


def test_overdue_todo_flag(client, scenario, auth, quiz_payload):
    payload = {**quiz_payload, 'due': (date.today() - timedelta(days=2)).isoformat()}
    response = client.post(f"/api/courses/{scenario['course_id']}/quizzes",
                           json=payload, headers=auth('one@demo.test'))
    assert response.status_code == 201
    qid = response.json()['id']
    todo = client.get('/api/todos', headers=auth('student1@demo.test'))
    assert todo.status_code == 200
    assert next(t for t in todo.json() if t['quizId'] == qid)['overdue'] is True
    assert client.get('/api/todos', headers=auth('one@demo.test')).status_code == 403
