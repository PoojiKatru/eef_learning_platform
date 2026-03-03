from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from database import get_db
import models, auth_utils
import re

router = APIRouter()

AVATAR_COLORS = ["#0d9488","#0891b2","#7c3aed","#db2777","#ea580c","#65a30d","#dc2626","#2563eb"]

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str  # educator or student

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain a special character")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CreateAdminRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.role not in ["educator", "student"]:
        raise HTTPException(400, "Role must be educator or student")
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    
    import random
    color = random.choice(AVATAR_COLORS)
    user = models.User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=auth_utils.hash_password(req.password),
        role=models.UserRole(req.role),
        status=models.AccountStatus.pending,
        avatar_color=color
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Notify all admins
    admins = db.query(models.User).filter(models.User.role == models.UserRole.admin).all()
    for admin in admins:
        notif = models.Notification(
            user_id=admin.id,
            title="New Account Request",
            message=f"{user.full_name} ({user.role}) has requested an account.",
            type="approval"
        )
        db.add(notif)
    db.commit()
    
    return {"message": "Registration successful. Awaiting admin approval."}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth_utils.verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    
    if user.status == models.AccountStatus.pending:
        raise HTTPException(403, "Account pending admin approval")
    if user.status == models.AccountStatus.rejected:
        raise HTTPException(403, "Account has been rejected")
    
    token = auth_utils.create_token({"sub": user.id})
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "avatar_color": user.avatar_color
        }
    }

@router.post("/create-admin")
def create_admin(req: CreateAdminRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth_utils.require_roles(models.UserRole.admin))):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    admin = models.User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=auth_utils.hash_password(req.password),
        role=models.UserRole.admin,
        status=models.AccountStatus.approved
    )
    db.add(admin)
    db.commit()
    return {"message": "Admin created"}

@router.get("/me")
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_color": current_user.avatar_color
    }

@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    """One-time setup: create first admin"""
    if db.query(models.User).filter(models.User.role == models.UserRole.admin).count() > 0:
        raise HTTPException(400, "Admin already exists")
    admin = models.User(
        full_name="Admin",
        email="admin@eef.org",
        hashed_password=auth_utils.hash_password("Admin@123!"),
        role=models.UserRole.admin,
        status=models.AccountStatus.approved
    )
    db.add(admin)
    db.commit()
    return {"message": "Admin created", "email": "admin@eef.org", "password": "Admin@123!"}
