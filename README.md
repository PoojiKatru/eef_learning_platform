# 🌟 Empowering Education Foundation — Learning Platform

A full-stack educational platform with role-based dashboards for Admins, Educators, and Students.

---

## 🚀 Quick Start

### Option A: Docker (Recommended)
```bash
docker-compose up --build
```
Then visit http://localhost:3000

### Option B: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Start PostgreSQL and create database
createdb eef_db

# Run the server
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 🔑 First-Time Setup

1. After starting, create the first admin account:
```
POST http://localhost:8000/api/auth/seed-admin
```
Or visit: http://localhost:8000/docs and call `/api/auth/seed-admin`

2. Login credentials:
- **Email:** admin@eef.org
- **Password:** Admin@123!

3. From the admin dashboard, approve new user accounts as they register.

---

## 👥 User Roles

| Role | How Created | Access |
|------|-------------|--------|
| **Admin** | By another admin only | Everything + user management |
| **Educator** | Self-register → admin approves | Assigned classrooms |
| **Student** | Self-register → admin approves | Enrolled classrooms |

---

## ✨ Features

### Admin
- Approve/reject new account requests
- Create classrooms with custom colors
- Assign educators and students to classrooms
- Grant educator admin privileges per classroom
- Access all classrooms with full teacher capabilities

### Educator (per classroom)
- 🎬 **Videos** — Add YouTube links for students to watch
- 📝 **Assignments** — Create, receive submissions, grade with feedback
- 📊 **Quizzes** — Build multiple choice/true-false/short answer quizzes with timers
- 📅 **Attendance** — Mark present/absent/late/excused per session
- 📹 **Live Sessions** — Post Zoom links with date/time
- 💬 **Messages** — Private 1:1 with students

### Student (per classroom)
- Watch embedded YouTube lessons
- Submit assignments, see grades immediately
- Take quizzes, see results + correct answers right away
- View posted Zoom links and join
- Message their teachers directly

---

## 🔐 Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS (Playfair Display + DM Sans fonts) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT (python-jose) + bcrypt |
| API | REST |

---

## 📁 Project Structure

```
eef-app/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # DB connection
│   ├── auth_utils.py        # JWT + password utils
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py
│       ├── users.py
│       ├── classrooms.py
│       ├── assignments.py
│       ├── quizzes.py
│       ├── videos.py
│       ├── attendance.py
│       ├── messages.py
│       └── notifications.py
├── frontend/
│   └── src/
│       ├── App.js
│       ├── index.css
│       ├── context/AuthContext.js
│       ├── utils/api.js
│       ├── components/AppLayout.js
│       └── pages/
│           ├── auth/         LoginPage, RegisterPage, PendingPage
│           ├── admin/        AdminDashboard
│           ├── educator/     EducatorDashboard
│           ├── student/      StudentDashboard
│           └── classroom/    ClassroomPage (all tabs)
└── docker-compose.yml
```

---

## 🌐 API Documentation
FastAPI auto-generates docs at: http://localhost:8000/docs
