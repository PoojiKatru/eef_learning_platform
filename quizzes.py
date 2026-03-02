from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from database import get_db
import models, auth_utils

router = APIRouter()

class QuizCreate(BaseModel):
    classroom_id: int
    title: str
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    due_date: Optional[datetime] = None
    questions: List[Any] = []

class QuizAttemptCreate(BaseModel):
    answers: dict

def can_teach(user, classroom_id, db):
    if user.role == models.UserRole.admin:
        return True
    return db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=user.id).first() is not None

def calculate_score(questions, answers):
    if not questions:
        return 0
    correct = 0
    total_auto = 0
    for q in questions:
        if q.get("type") in ["multiple_choice", "true_false"]:
            total_auto += 1
            qid = str(q["id"])
            if answers.get(qid) == q.get("correct_answer"):
                correct += 1
    if total_auto == 0:
        return None  # all short answer, manual grade needed
    return round((correct / total_auto) * 100, 1)

@router.get("/classroom/{classroom_id}")
def get_quizzes(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.classroom_id == classroom_id).all()
    result = []
    for q in quizzes:
        my_attempt = None
        if current_user.role == models.UserRole.student:
            attempt = db.query(models.QuizAttempt).filter_by(quiz_id=q.id, student_id=current_user.id).first()
            if attempt:
                my_attempt = {"score": attempt.score, "answers": attempt.answers, "completed_at": attempt.completed_at}
        result.append({
            "id": q.id, "title": q.title, "description": q.description,
            "time_limit_minutes": q.time_limit_minutes, "due_date": q.due_date,
            "question_count": len(q.questions),
            "questions": q.questions if (can_teach(current_user, classroom_id, db) or my_attempt) else [{"id": qx["id"], "question": qx["question"], "type": qx["type"], "options": qx.get("options")} for qx in q.questions],
            "my_attempt": my_attempt,
            "attempt_count": len(q.attempts) if can_teach(current_user, classroom_id, db) else None
        })
    return result

@router.post("/")
def create_quiz(req: QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if not can_teach(current_user, req.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    quiz = models.Quiz(**req.dict())
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    classroom = db.query(models.Classroom).filter(models.Classroom.id == req.classroom_id).first()
    for cs in classroom.students:
        notif = models.Notification(user_id=cs.student_id, title="New Quiz", message=f"New quiz in {classroom.name}: {req.title}", type="quiz")
        db.add(notif)
    db.commit()
    return {"id": quiz.id, "title": quiz.title}

@router.post("/{quiz_id}/attempt")
def attempt_quiz(quiz_id: int, req: QuizAttemptCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.student))):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    existing = db.query(models.QuizAttempt).filter_by(quiz_id=quiz_id, student_id=current_user.id).first()
    if existing:
        raise HTTPException(400, "Already attempted")
    score = calculate_score(quiz.questions, req.answers)
    attempt = models.QuizAttempt(quiz_id=quiz_id, student_id=current_user.id, answers=req.answers, score=score)
    db.add(attempt)
    db.commit()
    return {"score": score, "answers": req.answers, "questions_with_answers": quiz.questions}

@router.get("/{quiz_id}/results")
def get_results(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz or not can_teach(current_user, quiz.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    return [{"student_id": a.student_id, "student_name": a.student.full_name, "score": a.score, "answers": a.answers, "completed_at": a.completed_at} for a in quiz.attempts]

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz or not can_teach(current_user, quiz.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    db.delete(quiz)
    db.commit()
    return {"message": "Deleted"}
