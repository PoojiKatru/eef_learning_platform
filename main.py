from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, classrooms, assignments, quizzes, videos, attendance, messages, notifications
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Empowering Education Foundation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/")
def root():
    return {"message": "EEF API running"}
