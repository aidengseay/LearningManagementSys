"""Curriculum endpoint integration checks using the isolated test database."""
import io


def test_module_and_text_link_permissions(client, scenario, auth):
    cid = scenario['course_id']
    base = f'/api/courses/{cid}/curriculum'
    owner = auth('one@demo.test')
    student = auth('student1@demo.test')
    other_instructor = auth('two@demo.test')
    outsider = auth('student3@demo.test')

    assert client.get(base).status_code == 401
    assert client.get(base, headers=outsider).status_code == 403
    assert client.post(base + '/modules', json={'title': 'Unauthorized'}, headers=student).status_code == 403
    assert client.post(base + '/modules', json={'title': 'Unauthorized'}, headers=other_instructor).status_code == 403
    created = client.post(base + '/modules', json={'title': 'Module 1', 'description': 'Intro'}, headers=owner)
    assert created.status_code == 201, created.text
    mid = created.json()['id']
    path = f'/api/curriculum/modules/{mid}/materials'
    text = client.post(path, json={'title': 'Lecture notes', 'type': 'TEXT', 'content': 'Welcome'}, headers=owner)
    assert text.status_code == 201, text.text
    material_id = text.json()['id']
    assert client.post(path, json={'title': 'Bad link', 'type': 'LINK', 'content': 'javascript:alert(1)'}, headers=owner).status_code == 422
    link = client.post(path, json={'title': 'Reference', 'type': 'LINK', 'content': 'https://example.org'}, headers=owner)
    assert link.status_code == 201
    assert len(client.get(base, headers=student).json()[0]['materials']) == 2
    assert client.patch(f'/api/curriculum/materials/{material_id}', json={'content': 'Updated'}, headers=student).status_code == 403
    assert client.patch(f'/api/curriculum/materials/{material_id}', json={'content': 'Updated'}, headers=owner).json()['content'] == 'Updated'
    assert client.delete(f'/api/curriculum/materials/{material_id}', headers=owner).status_code == 204
    assert len(client.get(base, headers=student).json()[0]['materials']) == 1
    assert client.delete(f'/api/curriculum/modules/{mid}', headers=owner).status_code == 204
    assert client.get(base, headers=student).json() == []


def test_pdf_upload_download_and_cleanup(client, scenario, auth, tmp_path, monkeypatch):
    import app.curriculum as curriculum
    monkeypatch.setattr(curriculum, 'UPLOAD_DIR', tmp_path)
    owner = auth('one@demo.test')
    student = auth('student1@demo.test')
    outsider = auth('student3@demo.test')
    cid = scenario['course_id']
    module = client.post(f'/api/courses/{cid}/curriculum/modules', json={'title': 'Files'}, headers=owner).json()
    route = f"/api/curriculum/modules/{module['id']}/upload?title=Course%20Syllabus"
    assert client.post(route, files={'file': ('bad.txt', b'plain text', 'text/plain')}, headers=owner).status_code == 422
    assert client.post(route, files={'file': ('fake.pdf', b'plain text', 'application/pdf')}, headers=owner).status_code == 422
    assert client.post(route, files={'file': ('notes.pdf', b'%PDF-1.4\nDemo', 'application/pdf')}, headers=student).status_code == 403
    uploaded = client.post(route, files={'file': ('notes.pdf', b'%PDF-1.4\nDemo', 'application/pdf')}, headers=owner)
    assert uploaded.status_code == 201, uploaded.text
    material_id = uploaded.json()['id']
    assert len(list(tmp_path.glob('*.pdf'))) == 1
    url = f'/api/curriculum/materials/{material_id}/download'
    assert client.get(url, headers=student).content == b'%PDF-1.4\nDemo'
    assert client.get(url, headers=outsider).status_code == 403
    assert client.get(url).status_code == 401
    assert client.delete(f'/api/curriculum/materials/{material_id}', headers=owner).status_code == 204
    assert not list(tmp_path.glob('*.pdf'))


def test_reordering_modules_and_materials(client, scenario, auth):
    owner = auth('one@demo.test')
    cid = scenario['course_id']
    root = f'/api/courses/{cid}/curriculum'
    ids = [client.post(root + '/modules', json={'title': title}, headers=owner).json()['id'] for title in ('First', 'Second')]
    response = client.put(root + '/modules/order', json={'ids': ids[::-1]}, headers=owner)
    assert response.status_code == 200, response.text
    assert [x['id'] for x in client.get(root, headers=owner).json()] == ids[::-1]
    assert client.put(root + '/modules/order', json={'ids': [ids[0], ids[0]]}, headers=owner).status_code == 422
    module_id = ids[0]
    mat_ids = [client.post(f'/api/curriculum/modules/{module_id}/materials', json={'title': label, 'type': 'TEXT', 'content': label}, headers=owner).json()['id'] for label in ('A', 'B')]
    path = f'/api/curriculum/modules/{module_id}/materials/order'
    assert client.put(path, json={'ids': mat_ids[::-1]}, headers=owner).status_code == 200
    modules = client.get(root, headers=owner).json()
    first = next(m for m in modules if m['id'] == module_id)
    assert [x['id'] for x in first['materials']] == mat_ids[::-1]
