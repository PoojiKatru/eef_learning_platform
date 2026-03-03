from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
import models, auth_utils

router = APIRouter()

class VideoCreate(BaseModel):
    classroom_id: int
    title: str
    description: Optional[str] = None
    youtube_url: str

def can_teach(user, classroom_id, db):
    if user.role == models.UserRole.admin:
        return True
    return db.query(models.ClassroomEducator).filter_by(classroom_id=classroom_id, educator_id=user.id).first() is not None

@router.get("/classroom/{classroom_id}")
def get_videos(classroom_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    videos = db.query(models.Video).filter(models.Video.classroom_id == classroom_id).all()
    return [{"id": v.id, "title": v.title, "description": v.description, "youtube_url": v.youtube_url, "created_at": v.created_at} for v in videos]

@router.post("/")
def add_video(req: VideoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    if not can_teach(current_user, req.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    video = models.Video(**req.dict())
    db.add(video)
    db.commit()
    db.refresh(video)
    return {"id": video.id, "title": video.title}

@router.delete("/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video or not can_teach(current_user, video.classroom_id, db):
        raise HTTPException(403, "Not authorized")
    db.delete(video)
    db.commit()
    return {"message": "Deleted"}
