from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
import models, auth_utils

router = APIRouter()

class AttendanceSessionCreate(BaseModel):
    classroom_id: int
    title: str = "Class Session"

class AttendanceRecordInput(BaseModel):
    student_id: int
    status: str  # present, absent, late, excused

class SubmitAttendance(BaseModel):
    records: List[AttendanceRecordInput]

def can_teach(user, classroom_id, db):
    if user.role == models.UserRole.admin:
        return True
    return db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=user.id).first() is not None

@router.get("/classroom/{classroom_id}")
def get_sessions(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    sessions = db.query(models.AttendanceSession).filter(models.AttendanceSession.classroom_id == classroom_id).order_by(models.AttendanceSession.session_date.desc()).all()
    result = []
    for s in sessions:
        records = {}
        for r in s.records:
            records[r.student_id] = r.status
        result.append({"id": s.id, "title": s.title, "session_date": s.session_date, "records": records})
    return result

@router.post("/session")
def create_session(req: AttendanceSessionCreate, body: SubmitAttendance, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if not can_teach(current_user, req.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    session = models.AttendanceSession(classroom_id=req.classroom_id, title=req.title)
    db.add(session)
    db.flush()
    for r in body.records:
        record = models.AttendanceRecord(session_id=session.id, student_id=r.student_id, status=r.status)
        db.add(record)
    db.commit()
    return {"id": session.id, "message": "Attendance saved"}

@router.get("/student/{student_id}/classroom/{classroom_id}")
def get_student_attendance(student_id: int, classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    sessions = db.query(models.AttendanceSession).filter(models.AttendanceSession.classroom_id == classroom_id).all()
    result = []
    for s in sessions:
        record = db.query(models.AttendanceRecord).filter_by(session_id=s.id, student_id=student_id).first()
        result.append({"session_date": s.session_date, "title": s.title, "status": record.status if record else "absent"})
    return result
