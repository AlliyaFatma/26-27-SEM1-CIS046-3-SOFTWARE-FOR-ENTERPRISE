# 🍌 Banana Classroom - Enterprise MERN Application

A full-stack enterprise web application built for the **CIS046-3 Software for Enterprise** module using **React 18**, **Node.js**, **Express.js**, and **MongoDB Atlas**, integrated with **Dr. Marc Conrad's Banana Math API**.

---

## 🎯 Key Project Features

- **Teacher & Student Separation**:
  - **Teacher Portal**: Secure sign-up and login with email and password to access the teacher dashboard.
  - **Classroom Code System**: Teachers create and manage unique classroom codes (e.g., `MATH-4921`, `MATH-101`) to distribute to students.
  - **Frictionless Student Access**: Students join directly by clicking **Student Join** in the navigation bar and entering their nickname and classroom code—no account or password required.
  - **10 Math Puzzle Challenge**: Students solve exactly 10 Banana Math puzzles with an interactive 0–9 keypad, keyboard support, question timer, and hints.
  - **Classroom Leaderboard**: Real-time ranking of students based on score, solved count, accuracy %, and completion time, complete with a question-by-question answer inspector modal for teachers.
- **Enterprise-Grade Cloud Architecture**: Cloud document storage via MongoDB Atlas, RESTful API routing, JWT stateless token authentication, and salted bcrypt password hashing.

---

## 🔄 System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Teacher["👨‍🏫 Teacher Flow"]
        T1["Teacher Sign Up / Log In"] --> T2["Teacher Dashboard"]
        T2 --> T3["Generate Classroom Code<br/>(e.g., MATH-4821)"]
    end

    subgraph Student["🎓 Student Flow"]
        S1["Click 'Student Join' in Navbar"] --> S2["Enter Nickname & Classroom Code"]
        S2 --> S3["10 Math Puzzle Challenge<br/>(Dr. Marc Conrad Banana API)"]
        S3 --> S4["Submit Challenge Results"]
    end

    subgraph Backend["⚙️ Backend & Cloud Storage"]
        B1["Express REST API (/api/classroom)"]
        B2["MongoDB Atlas Cloud Database"]
        B3["Dr. Marc Conrad API (External Service)"]
    end

    T3 -.->|"Shares Code"| S2
    S3 <-->|"Fetch Puzzles (JSON + PNG)"| B3
    S4 -->|"POST /api/classroom/submit"| B1
    B1 -->|"Store ClassroomSubmissions"| B2
    B2 -->|"GET /api/classroom/:code/leaderboard"| T2
```

---

## 🎓 Core Technical Competencies

### 1. 🐙 Git Version Control
- **Monorepo Structure**: Separate client and server directories managed in a single root repository.
- **Conventional Commits**: Semantic commit messages (`feat`, `refactor`, `docs`, `fix`) tracking features incrementally.
- **Security & Hygiene**: Environment files (`.env`), build outputs, and `node_modules` strictly ignored via `.gitignore`.

### 2. 🌐 Interoperability
- **External Web Service Interoperability**: Consumes Dr. Marc Conrad’s third-party Banana Game API (`https://marcconrad.com/uob/banana/api.php?out=json`) via a backend proxy with automatic direct fallbacks.
- **Client-Server REST Interoperability**: Decoupled React SPA and Express REST API communicating via JSON over HTTP with CORS enabled.
- **Database Interoperability**: Mongoose Object-Data Modeling (ODM) serializing JavaScript objects to BSON documents on MongoDB Atlas cloud clusters.

### 3. 🔐 Authentication & Security
- **Role-Based Access (RBAC)**: Distinct teacher and student flows tailored to classroom environments.
- **Salted Password Hashing**: Passwords hashed with `bcryptjs` using 10 salt rounds via Mongoose `pre('save')` hooks.
- **Stateless Token Authentication**: JSON Web Tokens (JWT) signed with a server secret and 7-day expiration.
- **Protected Route Middleware**: Express middleware verifying `Authorization: Bearer <token>` on teacher endpoints.
- **Client Session Persistence**: React Context API (`AuthContext`) with `localStorage` token caching and profile revalidation.

### 4. ⚡ Event Handling
- **React Synthetic Events**: Form handling (`onSubmit` with `e.preventDefault()`), dynamic button clicks (`onClick`), controlled inputs (`onChange`).
- **Hardware Keyboard Listeners**: Window-level `keydown` event listeners enabling students to use physical number keys `0`–`9` and `Enter`.
- **Timer & Lifecycle Events**: Active challenge stopwatches and per-question timers managed with `setInterval` and cleaned up with `clearInterval` on unmount.
- **Process Lifecycle Events**: Graceful shutdown listeners on `SIGINT` to safely disconnect from MongoDB.

---

## 📁 Project Directory Structure

```text
26-27-SEM1-CIS046-3-SOFTWARE-FOR-ENTERPRISE/
├── package.json             # Root scripts (run dev, server, client)
├── .gitignore               # Root git ignore
├── README.md                # Project documentation
│
├── server/                  # Backend Express + MongoDB Server (Port 5001)
│   ├── server.js            # Express server entry point & middleware
│   ├── package.json         # Backend dependencies & scripts
│   ├── .env                 # Server environment variables & MongoDB URI
│   ├── .env.example         # Template for environment configuration
│   ├── config/
│   │   └── db.js            # MongoDB Atlas connection handler & fallback
│   ├── models/
│   │   ├── User.js          # User model (teachers) with bcrypt hash
│   │   ├── Classroom.js     # Teacher-generated classroom codes
│   │   └── ClassroomSubmission.js # Student challenge scores & question breakdown
│   ├── controllers/
│   │   ├── authController.js       # Register, login, and profile controllers
│   │   ├── classroomController.js  # Code generation, validation, leaderboard
│   │   └── gameController.js       # Banana API proxy handler
│   ├── routes/
│   │   ├── authRoutes.js           # Auth routes (/api/auth)
│   │   ├── classroomRoutes.js      # Classroom routes (/api/classroom)
│   │   └── gameRoutes.js           # Game proxy routes (/api/game)
│   └── middleware/
│       └── authMiddleware.js       # JWT Bearer token protection middleware
│
└── client/                  # Frontend React Application (Vite on Port 5173)
    ├── index.html           # HTML entry point
    ├── vite.config.js       # Vite configuration with backend proxy
    ├── package.json         # Frontend dependencies (React 18, Lucide icons)
    └── src/
        ├── App.jsx          # Top-level routing & view manager
        ├── App.css          # Design system & component styles
        ├── index.css        # Global CSS variables & reset
        ├── context/
        │   └── AuthContext.jsx # React Context for auth state & token storage
        └── components/
            ├── Navbar.jsx           # Clean navigation with direct Student Join
            ├── LandingPage.jsx      # Modern landing page & feature highlights
            ├── AuthForm.jsx         # Teacher log-in & sign-up
            ├── StudentChallenge.jsx # 10-puzzle challenge & live leaderboard
            └── Dashboard.jsx        # Teacher portal: codes & leaderboard
```

---

## ⚙️ Environment Variables

Create or update `server/.env` with the following configuration:

| Variable | Description | Example Value |
|---|---|---|
| `PORT` | Backend server listening port | `5001` |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://user:pass@cluster.mongodb.net/banana_classroom` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `your_super_secret_jwt_key` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

> 💡 **Notice:** If `MONGODB_URI` is not provided, the server will automatically fall back to an embedded in-memory MongoDB instance for local testing without external dependencies.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### Run Client and Server Simultaneously
```bash
npm run dev
```

- **Frontend (Vite)**: `http://localhost:5173`
- **Backend (Express)**: `http://localhost:5001`

---

## 🔑 API Endpoints Reference

### 🏫 Classroom & Challenge Endpoints (`/api/classroom`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/classroom/create` | Teacher creates a new classroom code | Yes (Teacher) |
| `GET` | `/api/classroom/my-classrooms` | Teacher retrieves all created classrooms & stats | Yes (Teacher) |
| `DELETE` | `/api/classroom/:id` | Teacher deletes a classroom and its submissions | Yes (Teacher) |
| `GET` | `/api/classroom/validate/:code` | Validate classroom code when student joins | No |
| `POST` | `/api/classroom/submit` | Student submits completed 10-puzzle results | No |
| `GET` | `/api/classroom/:code/leaderboard` | Get ranked leaderboard for a classroom code | No |

### 🔐 Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new teacher account (email + password) | No |
| `POST` | `/api/auth/login` | Log in teacher and return JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated teacher profile | Yes (`Bearer <token>`) |

### 🍌 Banana Game Proxy Endpoints (`/api/game`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/game/puzzle` | Fetch puzzle from Dr. Marc Conrad API | No |
| `GET` | `/api/health` | Backend API health check | No |

---

## 🎮 Dr. Marc Conrad Banana API Integration

- **External API Endpoint**: `https://marcconrad.com/uob/banana/api.php?out=json`
- **Sample Payload**:
  ```json
  {
    "question": "https://www.sanfoh.com/uob/banana/data/tf30437c602f833b676c95503e6n122.png",
    "solution": 2
  }
  ```
- **Reference**: [Dr. Marc Conrad Banana API Documentation](https://marcconrad.com/uob/banana/doc.php)
