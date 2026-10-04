# 🧠 StudyMind — AI-Powered Study Management Platform

<div align="center">

![StudyMind Banner](https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=220&section=header&text=StudyMind&fontSize=58&fontColor=ffffff&fontAlignY=38&desc=AI-Powered%20Study%20Management%20Platform&descAlignY=58&descSize=18)

</div>

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

</div>

<div align="center">

![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)
![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-brightgreen?style=flat-square&logo=mongodb)
![Status](https://img.shields.io/badge/Status-Live-success?style=flat-square)
![License](https://img.shields.io/badge/License-Academic-blue?style=flat-square)

</div>

---

## 🌐 Live Project

| Type | Link |
|---|---|
| 🚀 Frontend | https://studymind-client.vercel.app |
| 🩺 Backend Health Check | https://studymind-api-fs6n.onrender.com/api/health |
| 📦 Repository | https://github.com/J-harshavardhan/StudyMind |

---

## 📌 Project Overview

**StudyMind** is a full-stack AI-powered study management platform designed to help students manage their learning workflow from one centralized dashboard.

It combines **notes, tasks, reminders, calendar planning, profile settings, and AI-powered study assistance** into a single productivity-focused web application.

The project is built with a production-ready architecture using:

- ⚛️ React + Vite frontend
- 🟢 Node.js + Express backend
- 🍃 MongoDB Atlas database
- 🔐 Secure HttpOnly cookie authentication
- 🤖 Gemini AI integration
- 🚀 Vercel frontend deployment
- ⚙️ Render backend deployment
- 🔁 Vercel API proxy for stable production authentication

---

## ✨ Key Highlights

- 🔐 Secure authentication with HttpOnly cookies
- 📝 Markdown-based note management
- 🗂️ Category-based note organization
- ✅ Task management system
- 📅 Calendar-based planning
- ⏰ Reminder management
- 🤖 AI assistant using Gemini API
- 👤 Profile and settings management
- 🌙 Theme and preference support
- 📱 Responsive UI
- 🧪 Backend and frontend testing support
- 🚀 Fully deployed production setup
- 🔁 API proxy to avoid cross-domain cookie issues

---

## 🧠 Why StudyMind?

Students often use separate tools for notes, reminders, deadlines, tasks, and AI help. This creates friction and reduces productivity.

**StudyMind solves this by giving students one complete digital study workspace.**

With StudyMind, a student can:

- Store study notes
- Organize notes by category
- Track tasks
- Plan study sessions
- View upcoming reminders
- Use AI help while studying
- Manage profile and preferences
- Stay logged in securely

---

## 🖼️ Screenshots

> Add your project screenshots inside `client/public/screenshots/` and update the image paths below.

### 🏠 Dashboard

```md
![Dashboard](client/public/screenshots/dashboard.png)
```

### 📝 Notes

```md
![Notes](client/public/screenshots/notes.png)
```

### 📅 Calendar

```md
![Calendar](client/public/screenshots/calendar.png)
```

### 🤖 AI Assistant

```md
![AI Assistant](client/public/screenshots/assistant.png)
```

---

## 🧩 Core Features

### 🔐 Authentication

- User registration
- User login
- Secure logout
- Protected routes
- Session validation
- Password change support
- HttpOnly cookie-based authentication
- No JWT storage in browser localStorage
- Secure production cookie handling

---

### 📝 Notes Management

- Create notes
- Edit notes
- Delete notes
- View note details
- Markdown editor support
- Markdown preview support
- Word count calculation
- Last viewed tracking
- Search and filter notes
- Pagination support
- Category-based organization

---

### 🗂️ Categories

- Create categories
- Update categories
- Delete categories
- Assign notes to categories
- User-specific category ownership
- Safe category deletion behavior

---

### ✅ Tasks

- Create study tasks
- View today’s tasks
- View task ranges
- Update tasks
- Delete tasks
- Mark tasks as completed
- Date-based task tracking
- User-specific task protection

---

### 📅 Calendar

- Monthly calendar view
- Upcoming events
- Task aggregation
- Reminder aggregation
- Date-based study planning
- Calendar-friendly study workflow

---

### ⏰ Reminders

- Create reminders
- View upcoming reminders
- Update reminders
- Delete reminders
- Recurring reminder support
- Reminder status tracking
- Browser notification preference support
- Sound preference support

---

### 🤖 AI Assistant

- AI-powered study support
- Gemini API integration
- Backend-secured API key
- No AI secret exposed to frontend
- Useful for study guidance, explanations, and productivity help

---

### 👤 Profile & Settings

- Update user profile
- Theme preference support
- Timezone-aware settings
- Daily focus goal configuration
- Reminder preference management
- Audio and notification controls

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[User Browser] --> B[Vercel Frontend]
    B --> C[Vercel API Proxy]
    C --> D[Render Backend API]
    D --> E[MongoDB Atlas]
    D --> F[Gemini AI API]

    B --> G[React Router]
    B --> H[Axios Client]
    D --> I[Express Routes]
    D --> J[Auth Middleware]
    D --> K[Mongoose Models]
```

---

## 🔁 Production API Flow

StudyMind uses a Vercel proxy to keep API requests under the frontend domain.

```text
Frontend:
https://studymind-client.vercel.app

Frontend API Request:
https://studymind-client.vercel.app/api/auth/login

Vercel Proxy Forwards To:
https://studymind-api-fs6n.onrender.com/api/auth/login
```

This avoids production cookie problems caused by separate frontend and backend domains.

---

## 📁 Project Folder Structure

```text
StudyMind/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── assistant.js
│   │   │   ├── calendar.js
│   │   │   ├── reminders.js
│   │   │   └── tasks.js
│   │   │
│   │   ├── components/
│   │   │   ├── notes/
│   │   │   └── ui/
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Assistant.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Focus.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Notes.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reminders.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Tasks.jsx
│   │   │
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js
│   │   │
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   │
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── test/
│
├── vercel.json
├── package.json
├── README.md
└── .gitignore
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | UI development |
| Vite | Fast frontend build tool |
| React Router | Client-side routing |
| Axios | API requests |
| React Hot Toast | Notifications |
| React Markdown | Markdown rendering |
| Remark GFM | GitHub-flavored Markdown |
| Rehype Highlight | Code highlighting |
| Lucide React | Icons |
| CSS | Responsive styling |

---

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Session token signing |
| Cookie Parser | Cookie handling |
| Helmet | Security headers |
| CORS | Cross-origin protection |
| Express Rate Limit | API rate limiting |
| Zod | Request validation |
| Dotenv | Environment configuration |

---

### Deployment

| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database |
| Google AI Studio | Gemini API key management |

---

## 🔐 Security Model

StudyMind follows secure full-stack authentication practices.

### Security Features

- HttpOnly authentication cookies
- Secure production cookie configuration
- JWT not exposed through frontend localStorage
- Backend-only Gemini API key
- Backend-only MongoDB URI
- Protected API routes
- Ownership checks for user data
- Password hashing
- Session validation
- Logout support
- Password change revocation
- Input validation
- Rate limiting
- CORS origin protection
- Environment variables for secrets

---

## 🔑 Environment Variables

### Frontend Environment Variables

Used in **Vercel**.

```env
VITE_API_URL=https://studymind-client.vercel.app
VITE_API_BASE_URL=https://studymind-client.vercel.app
```

> Do not put MongoDB URI, JWT secret, or Gemini API key in frontend variables.

---

### Backend Environment Variables

Used in **Render**.

```env
NODE_ENV=production
USE_MEMORY_DB=false
TRUST_PROXY=true
CLIENT_ORIGIN=https://studymind-client.vercel.app
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER/studymind?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
```

---

## ⚙️ Vercel Proxy Configuration

### `client/vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://studymind-api-fs6n.onrender.com/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

### Why this is used

This configuration solves two important problems:

1. API calls work through the frontend domain.
2. React Router routes do not show 404 after refresh.

Example:

```text
/login
/register
/dashboard
/notes
/tasks
/calendar
```

All direct routes correctly fall back to `index.html`.

---

## 🧪 API Routes

### Auth Routes

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/profile
PATCH  /api/auth/change-password
```

### Notes Routes

```text
GET     /api/notes
POST    /api/notes
GET     /api/notes/:id
PATCH   /api/notes/:id
DELETE  /api/notes/:id
PATCH   /api/notes/:id/pin
```

### Category Routes

```text
GET     /api/categories
POST    /api/categories
PATCH   /api/categories/:id
DELETE  /api/categories/:id
```

### Task Routes

```text
GET     /api/tasks/today
GET     /api/tasks/range
POST    /api/tasks
PATCH   /api/tasks/:id
PATCH   /api/tasks/:id/complete
DELETE  /api/tasks/:id
```

### Calendar Routes

```text
GET /api/calendar/month
GET /api/calendar/upcoming
```

### Reminder Routes

```text
GET     /api/reminders/upcoming
POST    /api/reminders
PATCH   /api/reminders/:id
DELETE  /api/reminders/:id
```

### AI Assistant Routes

```text
POST /api/assistant
```

### Health Route

```text
GET /api/health
```

---

## 🚀 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/J-harshavardhan/StudyMind.git
cd StudyMind
```

---

### 2. Install Root Dependencies

```bash
npm install
```

---

### 3. Install Client Dependencies

```bash
cd client
npm install
cd ..
```

---

### 4. Create `.env`

Create a `.env` file in the root folder.

```env
NODE_ENV=development
USE_MEMORY_DB=true
JWT_SECRET=your_local_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

For MongoDB Atlas locally:

```env
USE_MEMORY_DB=false
MONGO_URI=your_mongodb_atlas_connection_string
```

---

### 5. Run Project Locally

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

---

### 6. Run With Memory Database

```bash
npm run dev:memory
```

---

## 🧪 Testing

### Backend Tests

```bash
npm test
```

### Client Tests

```bash
npm run test:client
```

### Build Client

```bash
npm --prefix client run build
```

### Full Build

```bash
npm run build
```

---

## 🚀 Deployment Guide

## Frontend Deployment — Vercel

Recommended Vercel configuration:

```text
Framework Preset: Vite
Root Directory: client
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Environment variables:

```env
VITE_API_URL=https://studymind-client.vercel.app
VITE_API_BASE_URL=https://studymind-client.vercel.app
```

---

## Backend Deployment — Render

Recommended Render configuration:

```text
Runtime: Node
Root Directory: blank
Build Command: npm install --include=dev
Start Command: node server/src/server.js
```

Required environment variables:

```env
NODE_ENV=production
USE_MEMORY_DB=false
TRUST_PROXY=true
CLIENT_ORIGIN=https://studymind-client.vercel.app
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

---

## 🧯 Troubleshooting

### Problem: Request goes to `/api/api`

Incorrect environment value:

```env
VITE_API_URL=https://studymind-client.vercel.app/api
```

Correct value:

```env
VITE_API_URL=https://studymind-client.vercel.app
```

---

### Problem: Login redirects back to Login

Check:

- `withCredentials: true` exists in Axios
- Vercel proxy is configured
- `VITE_API_URL` points to frontend domain
- Browser cookies/cache are cleared
- Render backend is live
- `/api/auth/login` returns success

---

### Problem: Direct route refresh shows 404

Add this rewrite:

```json
{
  "source": "/:path*",
  "destination": "/index.html"
}
```

---

### Problem: Render says Mongo URI is missing

Use:

```env
MONGO_URI=your_connection_string
```

Not:

```env
MONGODB_URI=your_connection_string
```

---

### Problem: Render cannot find `mongodb-memory-server`

Use this Render build command:

```bash
npm install --include=dev
```

---

## 📈 Learning Outcomes

This project helped practice and demonstrate:

- Full-stack architecture
- React application structure
- Protected frontend routes
- Secure authentication
- HttpOnly cookie sessions
- REST API design
- MongoDB schema design
- Mongoose models
- Backend validation
- Error handling
- Frontend state management
- API proxy configuration
- Deployment on Vercel and Render
- Environment variable management
- Production debugging
- AI API integration

---

## 🔮 Future Enhancements

- 📊 Study analytics dashboard
- ⏱️ Pomodoro focus timer
- 🔥 Study streak tracking
- 📄 Export notes as PDF
- 📧 Email reminders
- 📱 PWA support
- 📚 File attachments in notes
- 👥 Collaborative study rooms
- 🧠 Advanced AI summarization
- 🔍 Semantic note search
- 📆 Google Calendar integration

---

## 👨‍💻 Author

<div align="center">

### Harshavardhan J

AIML student focused on building strong full-stack, AI, data, and problem-solving projects.

</div>

---

## 🔗 Connect

```text
GitHub:   https://github.com/J-harshavardhan
Project:  https://github.com/J-harshavardhan/StudyMind
Live App: https://studymind-client.vercel.app
```

---

## 📄 License

This project is created for academic, learning, and portfolio purposes.

---

## ✅ Final Project Status

```text
Frontend:        Deployed on Vercel
Backend:         Deployed on Render
Database:        MongoDB Atlas
Authentication:  Secure HttpOnly cookie auth
AI:              Gemini API integrated
API Flow:        Vercel proxy enabled
Status:          Live and working
```

---

<div align="center">

### ⭐ If you like this project, give it a star!

![Footer](https://capsule-render.vercel.app/api?type=waving&color=0:764ba2,100:667eea&height=120&section=footer)

</div>
