from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import assignments
from app.grading import migrate_quiz_points
from app.models import Assignment


def make_assignment(client, scenario, auth, **kwargs):
    data = {
        'title': 'Research paper', 'description': 'Submit your work',
        'dueAt': (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        'maxPoints': 50, 'submissionType': 'BOTH',
        **kwargs,
    }
    response = client.post(f"/api/courses/{scenario['course_id']}/assignments",
                           json=data, headers=auth('one@demo.test'))
    assert response.status_code == 201, response.text
    return response.json()


def test_assignment_creation_visibility_and_permissions(client, scenario, auth):
    a = make_assignment(client, scenario, auth)
    aid = a['id']; cid = scenario['course_id']
    assert a['maxPoints'] == 50
    assert client.get(f'/api/assignments/{aid}', headers=auth('student1@demo.test')).status_code == 200
    assert client.get(f'/api/assignments/{aid}', headers=auth('student3@demo.test')).status_code == 403
    assert client.patch(f'/api/assignments/{aid}', json={'title':'hacked'}, headers=auth('two@demo.test')).status_code == 403
    assert client.post(f'/api/courses/{cid}/assignments', json={'title': 'Fake'},
                       headers=auth('student1@demo.test')).status_code == 403
    assert len(client.get(f'/api/courses/{cid}/assignments', headers=auth('student1@demo.test')).json()) == 1


def test_text_submit_grade_resubmit_todos_and_gradebook(client, scenario, auth):
    aid = make_assignment(client, scenario, auth)['id']
    cid = scenario['course_id']
    student = auth('student1@demo.test')
    instructor = auth('one@demo.test')
    before = client.get('/api/todos/unified', headers=student).json()
    assert any(t['type']=='ASSIGNMENT' and t['id']==aid for t in before)
    res = client.put(f'/api/assignments/{aid}/submission/text', json={'text':'First draft'}, headers=student)
    assert res.status_code == 200, res.text
    assert res.json()['text'] == 'First draft'
    assert all(t['id'] != aid for t in client.get('/api/todos/unified', headers=student).json() if t['type']=='ASSIGNMENT')
    grade = client.put(f'/api/assignments/{aid}/students/{scenario["users"]["student1@demo.test"]}/grade',
                       json={'pointsEarned':45, 'feedback':'Good work'}, headers=instructor)
    assert grade.status_code == 200, grade.text
    assert grade.json()['percentage'] == 90
    report = client.get(f'/api/courses/{cid}/my-grades/unified', headers=student).json()
    assert report['earnedPoints'] == 45 and report['possiblePoints'] == 50 and report['overallPercentage'] == 90
    assert client.get(f'/api/courses/{cid}/gradebook/unified', headers=auth('two@demo.test')).status_code == 403
    assert client.get(f'/api/courses/{cid}/gradebook/unified', headers=student).status_code == 403
    resub = client.put(f'/api/assignments/{aid}/submission/text', json={'text':'Updated draft'}, headers=student)
    assert resub.status_code == 200 and resub.json()['pointsEarned'] is None
    assert client.get(f'/api/courses/{cid}/my-grades/unified', headers=student).json()['overallPercentage'] is None


def test_manual_zero_missing_and_validation(client, scenario, auth):
    a = make_assignment(client, scenario, auth)
    aid=a['id']; cid=scenario['course_id']
    student_id=scenario['users']['student2@demo.test']
    path=f'/api/assignments/{aid}/students/{student_id}/grade'
    instructor=auth('one@demo.test')
    assert client.put(path, json={'pointsEarned':51}, headers=instructor).status_code == 422
    assert client.put(path, json={'pointsEarned':0, 'feedback':'Missing'}, headers=instructor).status_code == 200
    report=client.get(f'/api/courses/{cid}/my-grades/unified', headers=auth('student2@demo.test')).json()
    assert report['possiblePoints']==50 and report['overallPercentage']==0
    assert client.patch(f'/api/assignments/{aid}', json={'maxPoints':0}, headers=instructor).status_code == 422
    assert client.patch(f'/api/assignments/{aid}', json={'maxPoints':1}, headers=instructor).status_code == 200
    assert client.put(f'/api/assignments/{aid}/submission/text',json={'text':' '},headers=auth('student1@demo.test')).status_code == 422
    assert client.get(f'/api/assignments/{aid}/submissions', headers=auth('student1@demo.test')).status_code == 403


def test_pdf_upload_is_private_and_persistent(client, scenario, auth, tmp_path, monkeypatch):
    monkeypatch.setattr(assignments, 'UPLOAD_DIR', tmp_path)
    a=make_assignment(client, scenario, auth)
    aid=a['id']
    data={'file':('paper.pdf', b'%PDF-1.4\nexample', 'application/pdf')}
    student=auth('student1@demo.test')
    uploaded=client.put(f'/api/assignments/{aid}/submission/pdf', files=data, headers=student)
    assert uploaded.status_code==200, uploaded.text
    assert uploaded.json()['filename']=='paper.pdf'
    path=f'/api/assignments/{aid}/students/{scenario["users"]["student1@demo.test"]}/pdf'
    assert client.get(path,headers=student).status_code==200
    assert client.get(path,headers=auth('student2@demo.test')).status_code==403
    assert client.get(path,headers=auth('one@demo.test')).status_code==200
    invalid=client.put(f'/api/assignments/{aid}/submission/pdf',
                       files={'file':('x.pdf',b'not a pdf','application/pdf')},headers=student)
    assert invalid.status_code==422
    assert client.put(f'/api/assignments/{aid}/submission/text',json={'text':'New text'},headers=student).status_code==200
    assert len(list(tmp_path.glob('*.pdf')))==0


def test_quiz_points_and_unified_totals(client, scenario, auth, created_quiz):
    cid=scenario['course_id']; qid=created_quiz['id']
    instructor=auth('one@demo.test'); student=auth('student1@demo.test')
    assert created_quiz['maxPoints']==2
    a=make_assignment(client, scenario, auth, maxPoints=80)
    questions=created_quiz['questions']
    qids=[q['id'] for q in questions]
    res=client.post(f'/api/quizzes/{qid}/submissions',
        json={'answers': {str(qids[0]): 1, str(qids[1]): 0}},headers=student)
    assert res.status_code==201
    grade=client.get(f'/api/courses/{cid}/my-grades/unified',headers=student).json()
    assert grade['earnedPoints']==1 and grade['possiblePoints']==2
    assert any(x['type']=='ASSIGNMENT' and x['id']==a['id'] for x in grade['grades'])


def test_invalid_assignment_pdf_access_and_deletion(client, scenario, auth, tmp_path, monkeypatch):
    monkeypatch.setattr(assignments, 'UPLOAD_DIR', tmp_path)
    a=make_assignment(client, scenario, auth, submissionType='TEXT')
    aid=a['id']; student=auth('student1@demo.test'); instructor=auth('one@demo.test')
    assert client.put(f'/api/assignments/{aid}/submission/pdf',
                      files={'file':('report.pdf', b'%PDF-1.4\n', 'application/pdf')},headers=student).status_code==422
    assert client.delete(f'/api/assignments/{aid}',headers=student).status_code==403
    assert client.delete(f'/api/assignments/{aid}',headers=instructor).status_code==204
    assert client.get(f'/api/assignments/{aid}',headers=instructor).status_code==404
