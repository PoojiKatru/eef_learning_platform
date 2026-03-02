from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, auth_utils

router = APIRouter()

@router.get("/")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    notifs = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).limit(50).all()
    return [{"id": n.id, "title": n.title, "message": n.message, "type": n.type, "is_read": n.is_read, "created_at": n.created_at} for n in notifs]

@router.post("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id, models.Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked read"}

@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    db.query(models.Notification).filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All marked read"}

@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    count = db.query(models.Notification).filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False).count()
    return {"count": count}
