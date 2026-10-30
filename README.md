# 🍌 Banana Classroom - MERN Stack Portal

A modern web application built with **React**, **Node.js**, **Express.js**, and **MongoDB Atlas**, featuring:
- **Teacher & Student Architecture**:
  - **Teacher Login & Sign Up**: Teachers register with email and password to access their dedicated management dashboard.
  - **Classroom Code Generation**: Teachers create classroom codes (e.g. `MATH-4921`, `BANANA-101`) to distribute to their students.
  - **Navbar "Student" Entry**: Students can click the **Student** button directly from the navbar, enter their nickname/username and classroom code—without needing an account!
  - **10 Math Puzzle Challenge**: Students solve exactly 10 Banana Math puzzles from Dr. Marc Conrad's API with an interactive progress tracker, timer, hints, and score calculations.
  - **Classroom Leaderboard on Teacher Dashboard**: Teachers see live classroom rankings of students sorted by score, accuracy, and completion time, with detailed question-by-question answer breakdowns.
- **MongoDB Atlas Integration**: Cloud database document storage with Mongoose schemas for users, classrooms, and student submissions.

---

## 📁 Project Structure

```text
26-27-SEM1-CIS046-3-SOFTWARE-FOR-ENTERPRISE/
├── package.json             # Root scripts (run dev, server, client)
├── .gitignore               # Root git ignore
├── README.md                # Project documentation
│
├── server/                  # Backend Express + MongoDB Server (Port 5001)
│   ├── server.js            # Express server entry point
│   ├── package.json         # Backend dependencies & scripts
│   ├── .env                 # Server environment variables & MongoDB Atlas URI
│   ├── .env.example         # Template for environment configuration
│   ├── config/
│   │   └── db.js            # MongoDB Atlas connection handler
│   ├── models/
│   │   ├── User.js          # User model (teachers & students) with bcrypt hash
│   │   ├── Classroom.js     # Classroom codes created by teachers
│   │   └── ClassroomSubmission.js # Student 10-puzzle challenge submissions
│   ├── controllers/
│   │   ├── authController.js# Register, login, and profile controllers
│   │   ├── gameController.js# Banana puzzle and player stats controllers
│   │   └── classroomController.js # Classroom code & leaderboard controllers
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication endpoints (/api/auth)
│   │   ├── gameRoutes.js    # Game endpoints (/api/game)
│   │   └── classroomRoutes.js # Classroom endpoints (/api/classroom)
│   └── middleware/
│       └── authMiddleware.js# JWT Bearer token protection middleware
│
└── client/                  # Frontend React Application (Vite on Port 5173)
    ├── index.html           # HTML entry point
    ├── vite.config.js       # Vite configuration with backend proxy
    ├── package.json         # Frontend dependencies (React 18, Lucide icons)
    └── src/
        ├── App.jsx          # Top-level view manager
        ├── App.css          # Modern component styles
        ├── index.css        # Global design system & theme variables
        ├── context/
        │   └── AuthContext.jsx # React Context for auth state & token storage
        └── components/
            ├── Navbar.jsx           # Nav bar with dedicated Student button & teacher actions
            ├── LandingPage.jsx      # Landing page with student and teacher entry points
            ├── AuthForm.jsx         # Teacher/student login & role-based sign up
            ├── StudentChallenge.jsx # Student 10-puzzle challenge & live classroom leaderboard
            └── Dashboard.jsx        # Teacher dashboard: manage classroom codes & view leaderboard
```

---

## ☁️ How to Connect MongoDB Atlas

1. **Log in or Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and log in.
2. **Create a Free Cluster**: Click **Create Cluster** (M0 Free Tier).
3. **Set Up Database Access (User)**:
   - In Atlas left sidebar, click **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Create a username and password. Select **Read and write to any database**.
4. **Set Up Network Access (IP Whitelist)**:
   - In Atlas left sidebar, click **Security** > **Network Access**.
   - Click **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`) -> Click **Confirm**.
5. **Paste into `server/.env`**:
   Open [`server/.env`](file:///Users/nirushmanshrestha/Documents/Uni%20/ff/26-27-SEM1-CIS046-3-SOFTWARE-FOR-ENTERPRISE/server/.env) and update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/banana_classroom?retryWrites=true&w=majority
   ```

> 💡 **Notice:** If you don't enter an Atlas string, the server automatically starts an embedded development database so you can test immediately.

---

## 🚀 How to Run the Project

### Run Both Simultaneously (Recommended)
From the project root:
```bash
npm run dev
```

### Or Run in Separate Terminals

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Backend will run at: `http://localhost:5001`

**Terminal 2 - React Frontend:**
```bash
cd client
npm run dev
```
Frontend will run at: `http://localhost:5173`

---

## 🔑 API Endpoints

### 🏫 Classroom & Student Challenge Endpoints (`/api/classroom`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/classroom/create` | Teacher creates a classroom with a custom/auto code | Yes (Teacher) |
| `GET` | `/api/classroom/my-classrooms` | Teacher retrieves all their classrooms and stats | Yes (Teacher) |
| `DELETE` | `/api/classroom/:id` | Teacher deletes a classroom and its submissions | Yes (Teacher) |
| `GET` | `/api/classroom/validate/:code` | Validate classroom code when student joins | No |
| `POST` | `/api/classroom/submit` | Student submits 10-puzzle results to leaderboard | No |
| `GET` | `/api/classroom/:code/leaderboard` | Get ranked classroom leaderboard for a code | No |

### 🔐 Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`role`: `'teacher'` or `'student'`) | No |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | No |
| `GET` | `/api/auth/me` | Fetch current user profile | Yes (`Bearer <token>`) |

### 🍌 Banana Game Endpoints (`/api/game`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/game/puzzle` | Fetch fresh puzzle from Marc Conrad Banana API | No |
| `POST` | `/api/game/record` | Submit guess, update score and streak | Yes (`Bearer <token>`) |
| `GET` | `/api/game/stats` | Retrieve user stats, win rate & history | Yes (`Bearer <token>`) |
| `GET` | `/api/game/leaderboard` | Global player leaderboard | No |
