from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    educator = "educator"
    student = "student"

class AccountStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(AccountStatus), default=AccountStatus.pending)
    avatar_color = Column(String, default="#0d9488")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    taught_classes = relationship("ClassroomEducator", back_populates="educator")
    enrolled_classes = relationship("ClassroomStudent", back_populates="student")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String)
    description = Column(Text)
    color = Column(String, default="#0d9488")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    educators = relationship("ClassroomEducator", back_populates="classroom")
    students = relationship("ClassroomStudent", back_populates="classroom")
    videos = relationship("Video", back_populates="classroom")
    assignments = relationship("Assignment", back_populates="classroom")
    quizzes = relationship("Quiz", back_populates="classroom")
    attendance_sessions = relationship("AttendanceSession", back_populates="classroom")
    zoom_links = relationship("ZoomLink", back_populates="classroom")

class ClassroomEducator(Base):
    __tablename__ = "classroom_educators"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    educator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    is_admin = Column(Boolean, default=False)
    classroom = relationship("Classroom", back_populates="educators")
    educator = relationship("User", back_populates="taught_classes")

class ClassroomStudent(Base):
    __tablename__ = "classroom_students"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    classroom = relationship("Classroom", back_populates="students")
    student = relationship("User", back_populates="enrolled_classes")

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text)
    youtube_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    classroom = relationship("Classroom", back_populates="videos")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    instructions = Column(Text)
    due_date = Column(DateTime(timezone=True))
    max_points = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    classroom = relationship("Classroom", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    content = Column(Text)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text)
    time_limit_minutes = Column(Integer, nullable=True)
    due_date = Column(DateTime(timezone=True))
    questions = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    classroom = relationship("Classroom", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    answers = Column(JSON, default={})
    score = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    session_date = Column(DateTime(timezone=True), server_default=func.now())
    title = Column(String, default="Class Session")
    records = relationship("AttendanceRecord", back_populates="session")
    classroom = relationship("Classroom", back_populates="attendance_sessions")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String, default="present")  # present, absent, late, excused
    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("User")

class ZoomLink(Base):
    __tablename__ = "zoom_links"
    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    scheduled_at = Column(DateTime(timezone=True))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    classroom = relationship("Classroom", back_populates="zoom_links")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    message = Column(Text)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="notifications")
