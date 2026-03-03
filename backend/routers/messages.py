from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models, auth_utils

router = APIRouter()

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    classroom_id: Optional[int] = None

class ZoomLinkCreate(BaseModel):
    classroom_id: int
    title: str
    url: str
    scheduled_at: Optional[str] = None
    description: Optional[str] = None

def can_teach(user, classroom_id, db):
    if user.role == models.UserRole.admin:
        return True
    return db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=user.id).first() is not None

@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    from sqlalchemy import or_
    messages = db.query(models.Message).filter(
        or_(models.Message.sender_id == current_user.id, models.Message.receiver_id == current_user.id)
    ).order_by(models.Message.created_at.desc()).all()
    
    convos = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other_id not in convos:
            other = db.query(models.User).filter(models.User.id == other_id).first()
            convos[other_id] = {
                "user_id": other_id,
                "user_name": other.full_name if other else "Unknown",
                "user_role": other.role if other else None,
                "avatar_color": other.avatar_color if other else "#666",
                "last_message": m.content,
                "last_at": m.created_at,
                "unread": 0
            }
        if m.receiver_id == current_user.id and not m.is_read:
            convos[other_id]["unread"] += 1
    return list(convos.values())

@router.get("/thread/{other_user_id}")
def get_thread(other_user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    from sqlalchemy import or_, and_
    messages = db.query(models.Message).filter(
        or_(
            and_(models.Message.sender_id == current_user.id, models.Message.receiver_id == other_user_id),
            and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == current_user.id)
        )
    ).order_by(models.Message.created_at.asc()).all()
    
    for m in messages:
        if m.receiver_id == current_user.id and not m.is_read:
            m.is_read = True
    db.commit()
    
    return [{"id": m.id, "sender_id": m.sender_id, "content": m.content, "created_at": m.created_at, "is_read": m.is_read} for m in messages]

@router.post("/")
def send_message(req: MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    # Students can only message educators in their classrooms
    if current_user.role == models.UserRole.student:
        receiver = db.query(models.User).filter(models.User.id == req.receiver_id).first()
        if not receiver or receiver.role not in [models.UserRole.educator, models.UserRole.admin]:
            raise HTTPException(403, "Students can only message teachers")
    
    message = models.Message(sender_id=current_user.id, receiver_id=req.receiver_id, content=req.content, classroom_id=req.classroom_id)
    db.add(message)
    
    notif = models.Notification(
        user_id=req.receiver_id,
        title=f"New message from {current_user.full_name}",
        message=req.content[:100],
        type="message"
    )
    db.add(notif)
    db.commit()
    return {"message": "Sent"}

# Zoom links
@router.get("/zoom/{classroom_id}")
def get_zoom_links(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    links = db.query(models.ZoomLink).filter(models.ZoomLink.classroom_id == classroom_id).order_by(models.ZoomLink.scheduled_at.desc()).all()
    return [{"id": l.id, "title": l.title, "url": l.url, "scheduled_at": l.scheduled_at, "description": l.description, "created_at": l.created_at} for l in links]

@router.post("/zoom")
def create_zoom_link(req: ZoomLinkCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if not can_teach(current_user, req.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    from datetime import datetime
    scheduled = None
    if req.scheduled_at:
        try:
            scheduled = datetime.fromisoformat(req.scheduled_at)
        except:
            pass
    link = models.ZoomLink(classroom_id=req.classroom_id, title=req.title, url=req.url, scheduled_at=scheduled, description=req.description)
    db.add(link)
    
    classroom = db.query(models.Classroom).filter(models.Classroom.id == req.classroom_id).first()
    for cs in classroom.students:
        notif = models.Notification(user_id=cs.student_id, title="Live Session Posted", message=f"New session in {classroom.name}: {req.title}", type="zoom")
        db.add(notif)
    db.commit()
    return {"message": "Zoom link added"}

@router.delete("/zoom/{link_id}")
def delete_zoom_link(link_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    link = db.query(models.ZoomLink).filter(models.ZoomLink.id == link_id).first()
    if not link or not can_teach(current_user, link.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    db.delete(link)
    db.commit()
    return {"message": "Deleted"}
