"""Private, course-scoped curriculum APIs and authenticated PDF downloads."""
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import current_user, get_db, require_instructor
from app.models import Course, CurriculumMaterial, CurriculumModule, Enrollment, User

router = APIRouter(prefix='/api', tags=['Curriculum'])
UPLOAD_DIR = Path(os.environ.get('CURRICULUM_UPLOAD_DIR', '/app/uploads'))
MAX_PDF_BYTES = 10 * 1024 * 1024


class ModuleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=10000)

    @field_validator('title')
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip()


class ModuleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    position: int | None = Field(default=None, ge=0)

    @field_validator('title')
    @classmethod
    def title_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip() if value is not None else None


class ReorderBody(BaseModel):
    ids: list[int] = Field(min_length=1)


class MaterialCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: Literal['TEXT', 'LINK']
    content: str = Field(min_length=1, max_length=50000)

    @field_validator('title')
    @classmethod
    def valid_title(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip()

    @field_validator('content')
    @classmethod
    def valid_content(cls, value: str, info) -> str:
        if not value.strip():
            raise ValueError('Content cannot be blank')
        # Keep author-entered whitespace for text lessons, normalize URL fields.
        return value.strip() if info.data.get('type') == 'LINK' else value


class MaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=50000)
    position: int | None = Field(default=None, ge=0)

    @field_validator('title')
    @classmethod
    def valid_title(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError('Title cannot be blank')
        return value.strip() if value is not None else None

    @field_validator('content')
    @classmethod
    def valid_content(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError('Content cannot be blank')
        return value


class MaterialOut(BaseModel):
    id: int
    moduleId: int
    title: str
    type: str
    content: str | None
    position: int
    createdAt: datetime
    updatedAt: datetime


class ModuleOut(BaseModel):
    id: int
    courseId: int
    title: str
    description: str
    position: int
    materials: list[MaterialOut]


def check_course(course_id: int, user: User, db: Session, *, edit: bool = False) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(404, detail='Course not found')
    if user.role == 'INSTRUCTOR' and course.instructor_id == user.id:
        return course
    if not edit and user.role == 'STUDENT' and db.scalar(select(Enrollment.id).where(
        Enrollment.course_id == course_id, Enrollment.student_id == user.id,
    )) is not None:
        return course
    raise HTTPException(403, detail='Not authorized for this course')


def require_module(module_id: int, user: User, db: Session, *, edit: bool = False) -> CurriculumModule:
    module = db.get(CurriculumModule, module_id)
    if module is None:
        raise HTTPException(404, detail='Module not found')
    check_course(module.course_id, user, db, edit=edit)
    return module


def require_material(material_id: int, user: User, db: Session, *, edit: bool = False) -> tuple[CurriculumMaterial, CurriculumModule]:
    material = db.get(CurriculumMaterial, material_id)
    if material is None:
        raise HTTPException(404, detail='Material not found')
    module = require_module(material.module_id, user, db, edit=edit)
    return material, module


def validate_link(url: str):
    parsed = urlsplit(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc or parsed.username or parsed.password:
        raise HTTPException(422, detail='Links must be HTTP(S) URLs without embedded credentials')


def out_material(material: CurriculumMaterial) -> MaterialOut:
    return MaterialOut(id=material.id, moduleId=material.module_id, title=material.title,
                       type=material.type, content=material.content, position=material.position,
                       createdAt=material.created_at, updatedAt=material.updated_at)


def out_module(module: CurriculumModule, db: Session) -> ModuleOut:
    materials = db.scalars(select(CurriculumMaterial).where(CurriculumMaterial.module_id == module.id)
                           .order_by(CurriculumMaterial.position, CurriculumMaterial.id)).all()
    return ModuleOut(id=module.id, courseId=module.course_id, title=module.title,
                     description=module.description, position=module.position,
                     materials=[out_material(item) for item in materials])


def next_position(db: Session, model, field, parent_id: int) -> int:
    return (db.scalar(select(func.max(model.position)).where(field == parent_id)) or 0) + 1


def remove_file(material: CurriculumMaterial):
    if material.type == 'PDF' and material.file_path:
        # Only generated UUID basenames are accepted; never resolve arbitrary paths.
        try:
            uuid.UUID(Path(material.file_path).stem)
        except ValueError:
            return
        if Path(material.file_path).name != material.file_path or not material.file_path.endswith('.pdf'):
            return
        (UPLOAD_DIR / material.file_path).unlink(missing_ok=True)


@router.get('/courses/{course_id}/curriculum', response_model=list[ModuleOut])
def list_curriculum(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    check_course(course_id, user, db)
    modules = db.scalars(select(CurriculumModule).where(CurriculumModule.course_id == course_id)
                         .order_by(CurriculumModule.position, CurriculumModule.id)).all()
    return [out_module(module, db) for module in modules]


@router.post('/courses/{course_id}/curriculum/modules', response_model=ModuleOut, status_code=201)
def create_module(course_id: int, body: ModuleCreate, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    check_course(course_id, instructor, db, edit=True)
    module = CurriculumModule(course_id=course_id, title=body.title, description=body.description,
                              position=next_position(db, CurriculumModule, CurriculumModule.course_id, course_id))
    db.add(module)
    db.commit()
    db.refresh(module)
    return out_module(module, db)


@router.patch('/curriculum/modules/{module_id}', response_model=ModuleOut)
def update_module(module_id: int, body: ModuleUpdate, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    module = require_module(module_id, instructor, db, edit=True)
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(module, key, value)
    db.commit()
    db.refresh(module)
    return out_module(module, db)


@router.put('/courses/{course_id}/curriculum/modules/order', response_model=list[ModuleOut])
def reorder_modules(course_id: int, body: ReorderBody, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    check_course(course_id, instructor, db, edit=True)
    modules = db.scalars(select(CurriculumModule).where(CurriculumModule.course_id == course_id)).all()
    if len(body.ids) != len(modules) or set(body.ids) != {m.id for m in modules}:
        raise HTTPException(422, detail='Provide every module ID for this course exactly once')
    position = {module_id: index for index, module_id in enumerate(body.ids)}
    for module in modules:
        module.position = position[module.id]
    db.commit()
    return [out_module(module, db) for module in sorted(modules, key=lambda m: m.position)]


@router.put('/curriculum/modules/{module_id}/materials/order', response_model=list[MaterialOut])
def reorder_materials(module_id: int, body: ReorderBody, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    require_module(module_id, instructor, db, edit=True)
    materials = db.scalars(select(CurriculumMaterial).where(CurriculumMaterial.module_id == module_id)).all()
    if len(body.ids) != len(materials) or set(body.ids) != {m.id for m in materials}:
        raise HTTPException(422, detail='Provide every material ID for this module exactly once')
    position = {material_id: index for index, material_id in enumerate(body.ids)}
    for material in materials:
        material.position = position[material.id]
    db.commit()
    return [out_material(material) for material in sorted(materials, key=lambda m: m.position)]


@router.delete('/curriculum/modules/{module_id}', status_code=204)
def delete_module(module_id: int, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    module = require_module(module_id, instructor, db, edit=True)
    materials = db.scalars(select(CurriculumMaterial).where(CurriculumMaterial.module_id == module.id)).all()
    for material in materials:
        db.delete(material)
    db.delete(module)
    db.commit()
    for material in materials:
        remove_file(material)


@router.post('/curriculum/modules/{module_id}/materials', response_model=MaterialOut, status_code=201)
def create_material(module_id: int, body: MaterialCreate, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    require_module(module_id, instructor, db, edit=True)
    if body.type == 'LINK':
        validate_link(body.content)
    material = CurriculumMaterial(module_id=module_id, title=body.title, type=body.type, content=body.content,
                                  position=next_position(db, CurriculumMaterial, CurriculumMaterial.module_id, module_id))
    db.add(material)
    db.commit()
    db.refresh(material)
    return out_material(material)


@router.post('/curriculum/modules/{module_id}/upload', response_model=MaterialOut, status_code=201)
async def upload_pdf(module_id: int, title: str, file: UploadFile = File(...),
                     instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    require_module(module_id, instructor, db, edit=True)
    if not title.strip() or len(title) > 200:
        raise HTTPException(422, detail='Title must be 1–200 characters')
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(422, detail='Only PDF files are supported')
    await file.seek(0)
    header = await file.read(5)
    if header != b'%PDF-':
        raise HTTPException(422, detail='File is not a valid PDF header')
    filename = f'{uuid.uuid4()}.pdf'
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_DIR / filename
    size = 5
    try:
        with destination.open('wb') as target:
            target.write(header)
            while True:
                chunk = await file.read(65536)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_PDF_BYTES:
                    raise HTTPException(413, detail='PDF exceeds 10 MB limit')
                target.write(chunk)
        material = CurriculumMaterial(module_id=module_id, title=title.strip(), type='PDF', file_path=filename,
                                      position=next_position(db, CurriculumMaterial, CurriculumMaterial.module_id, module_id))
        db.add(material)
        db.commit()
        db.refresh(material)
        return out_material(material)
    except Exception:
        destination.unlink(missing_ok=True)
        db.rollback()
        raise
    finally:
        await file.close()


@router.patch('/curriculum/materials/{material_id}', response_model=MaterialOut)
def update_material(material_id: int, body: MaterialUpdate, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    material, _ = require_material(material_id, instructor, db, edit=True)
    changes = body.model_dump(exclude_unset=True)
    if 'content' in changes:
        if material.type == 'PDF':
            raise HTTPException(422, detail='PDFs have no editable text content; upload a replacement')
        if material.type == 'LINK':
            validate_link(changes['content'])
    for key, value in changes.items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    return out_material(material)


@router.delete('/curriculum/materials/{material_id}', status_code=204)
def delete_material(material_id: int, instructor: User = Depends(require_instructor), db: Session = Depends(get_db)):
    material, _ = require_material(material_id, instructor, db, edit=True)
    db.delete(material)
    db.commit()
    remove_file(material)


@router.get('/curriculum/materials/{material_id}/download')
def download_pdf(material_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    material, _ = require_material(material_id, user, db)
    if material.type != 'PDF' or not material.file_path:
        raise HTTPException(404, detail='PDF not found')
    if Path(material.file_path).name != material.file_path:
        raise HTTPException(404, detail='PDF not found')
    try:
        uuid.UUID(Path(material.file_path).stem)
    except ValueError:
        raise HTTPException(404, detail='PDF not found') from None
    path = UPLOAD_DIR / material.file_path
    if not path.is_file():
        raise HTTPException(404, detail='PDF file missing from storage')
    return FileResponse(path, media_type='application/pdf', filename=f'{material.title}.pdf')
