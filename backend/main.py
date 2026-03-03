from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, classrooms, assignments, quizzes, videos, attendance, messages, notifications
from database import engine, Base, SessionLocal
import models
import auth_utils

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Empowering Education Foundation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(classrooms.router, prefix="/api/classrooms", tags=["classrooms"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

def create_default_admin():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.role == models.UserRole.admin).first()
        if not existing:
            admin = models.User(
                full_name="Admin",
                email="admin@eef.org",
                hashed_password=auth_utils.hash_password("Admin@123!"),
                role=models.UserRole.admin,
                status=models.AccountStatus.approved
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: admin@eef.org / Admin@123!")
    finally:
        db.close()

create_default_admin()

@app.get("/")
def root():
    return {"message": "EEF API running"}
