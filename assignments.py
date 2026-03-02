from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
import models, auth_utils

router = APIRouter()

class AssignmentCreate(BaseModel):
    classroom_id: int
    title: str
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: int = 100

class SubmissionCreate(BaseModel):
    content: str

class GradeRequest(BaseModel):
    grade: float
    feedback: Optional[str] = None

def can_teach(user, classroom_id, db):
    if user.role == models.UserRole.admin:
        return True
    return db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=user.id).first() is not None

@router.get("/classroom/{classroom_id}")
def get_assignments(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    assignments = db.query(models.Assignment).filter(models.Assignment.classroom_id == classroom_id).all()
    result = []
    for a in assignments:
        submission = None
        if current_user.role == models.UserRole.student:
            submission = db.query(models.AssignmentSubmission).filter_by(assignment_id=a.id, student_id=current_user.id).first()
        result.append({
            "id": a.id, "title": a.title, "instructions": a.instructions,
            "due_date": a.due_date, "max_points": a.max_points, "created_at": a.created_at,
            "submission_count": len(a.submissions),
            "my_submission": {"content": submission.content, "grade": submission.grade, "feedback": submission.feedback, "submitted_at": submission.submitted_at} if submission else None
        })
    return result

@router.post("/")
def create_assignment(req: AssignmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if not can_teach(current_user, req.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    assignment = models.Assignment(**req.dict())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    # Notify students
    classroom = db.query(models.Classroom).filter(models.Classroom.id == req.classroom_id).first()
    for cs in classroom.students:
        notif = models.Notification(user_id=cs.student_id, title="New Assignment", message=f"New assignment in {classroom.name}: {req.title}", type="assignment")
        db.add(notif)
    db.commit()
    return {"id": assignment.id, "title": assignment.title}

@router.post("/{assignment_id}/submit")
def submit_assignment(assignment_id: int, req: SubmissionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.student))):
    existing = db.query(models.AssignmentSubmission).filter_by(assignment_id=assignment_id, student_id=current_user.id).first()
    if existing:
        existing.content = req.content
        db.commit()
        return {"message": "Updated"}
    sub = models.AssignmentSubmission(assignment_id=assignment_id, student_id=current_user.id, content=req.content)
    db.add(sub)
    db.commit()
    return {"message": "Submitted"}

@router.get("/{assignment_id}/submissions")
def get_submissions(assignment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(404, "Not found")
    if not can_teach(current_user, assignment.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    return [{"id": s.id, "student_id": s.student_id, "student_name": s.student.full_name, "content": s.content, "grade": s.grade, "feedback": s.feedback, "submitted_at": s.submitted_at} for s in assignment.submissions]

@router.post("/submissions/{submission_id}/grade")
def grade_submission(submission_id: int, req: GradeRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(404, "Not found")
    if not can_teach(current_user, sub.assignment.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    sub.grade = req.grade
    sub.feedback = req.feedback
    notif = models.Notification(user_id=sub.student_id, title="Assignment Graded", message=f"Your assignment '{sub.assignment.title}' has been graded: {req.grade}/{sub.assignment.max_points}", type="grade")
    db.add(notif)
    db.commit()
    return {"message": "Graded"}

@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment or not can_teach(current_user, assignment.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    db.delete(assignment)
    db.commit()
    return {"message": "Deleted"}
