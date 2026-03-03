from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
import models, auth_utils

router = APIRouter()

class ClassroomCreate(BaseModel):
    name: str
    subject: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = "#0d9488"

class AssignRequest(BaseModel):
    user_id: int

class AssignEducatorRequest(BaseModel):
    educator_id: int
    is_admin: bool = False

def classroom_to_dict(c, current_user_id=None):
    return {
        "id": c.id,
        "name": c.name,
        "subject": c.subject,
        "description": c.description,
        "color": c.color,
        "created_at": c.created_at,
        "educator_count": len(c.educators),
        "student_count": len(c.students),
        "educators": [{"id": ce.educator.id, "full_name": ce.educator.full_name, "is_admin": ce.is_admin, "avatar_color": ce.educator.avatar_color} for ce in c.educators],
        "students": [{"id": cs.student.id, "full_name": cs.student.full_name, "avatar_color": cs.student.avatar_color} for cs in c.students],
    }

@router.get("/")
def get_classrooms(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if current_user.role == models.UserRole.admin:
        classrooms = db.query(models.Classroom).all()
    elif current_user.role == models.UserRole.educator:
        classrooms = [ce.classroom for ce in current_user.taught_classes]
    else:
        classrooms = [cs.classroom for cs in current_user.enrolled_classes]
    return [classroom_to_dict(c) for c in classrooms]

@router.post("/")
def create_classroom(req: ClassroomCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    classroom = models.Classroom(**req.dict())
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom_to_dict(classroom)

@router.get("/{classroom_id}")
def get_classroom(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(404, "Classroom not found")
    return classroom_to_dict(classroom)

@router.delete("/{classroom_id}")
def delete_classroom(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(404, "Classroom not found")
    db.delete(classroom)
    db.commit()
    return {"message": "Deleted"}

@router.post("/{classroom_id}/assign-student")
def assign_student(classroom_id: int, req: AssignRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    existing = db.query(models.ClassroomStudent).filter_by(classroom_id=classroom_id, student_id=req.user_id).first()
    if existing:
        raise HTTPException(400, "Student already in classroom")
    entry = models.ClassroomStudent(classroom_id=classroom_id, student_id=req.user_id)
    db.add(entry)
    db.commit()
    return {"message": "Student assigned"}

@router.delete("/{classroom_id}/remove-student/{student_id}")
def remove_student(classroom_id: int, student_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    entry = db.query(models.ClassroomStudent).filter_by(classroom_id=classroom_id, student_id=student_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"message": "Removed"}

@router.post("/{classroom_id}/assign-educator")
def assign_educator(classroom_id: int, req: AssignEducatorRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    existing = db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=req.educator_id).first()
    if existing:
        existing.is_admin = req.is_admin
        db.commit()
        return {"message": "Updated"}
    entry = models.ClassroomEducator(classroom_id=classroom_id, educator_id=req.educator_id, is_admin=req.is_admin)
    db.add(entry)
    db.commit()
    return {"message": "Educator assigned"}

@router.delete("/{classroom_id}/remove-educator/{educator_id}")
def remove_educator(classroom_id: int, educator_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    entry = db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=educator_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"message": "Removed"}
