from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, auth_utils

router = APIRouter()

@router.get("/pending")
def get_pending(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    users = db.query(models.User).filter(models.User.status == models.AccountStatus.pending).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]

@router.get("/all")
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    users = db.query(models.User).filter(models.User.role != models.UserRole.admin).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role, "status": u.status, "avatar_color": u.avatar_color} for u in users]

@router.get("/educators")
def get_educators(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    users = db.query(models.User).filter(models.User.role == models.UserRole.educator, models.User.status == models.AccountStatus.approved).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "avatar_color": u.avatar_color} for u in users]

@router.get("/students")
def get_students(db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    users = db.query(models.User).filter(models.User.role == models.UserRole.student, models.User.status == models.AccountStatus.approved).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "avatar_color": u.avatar_color} for u in users]

@router.post("/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.status = models.AccountStatus.approved
    notif = models.Notification(user_id=user.id, title="Account Approved", message="Your account has been approved! You can now log in.", type="success")
    db.add(notif)
    db.commit()
    return {"message": "User approved"}

@router.post("/{user_id}/reject")
def reject_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.status = models.AccountStatus.rejected
    db.commit()
    return {"message": "User rejected"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == models.UserRole.admin:
        raise HTTPException(400, "Cannot delete admin accounts")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
