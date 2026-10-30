# 🍌 Banana Classroom - MERN Stack Portal

A modern web application built with **React**, **Node.js**, **Express.js**, and **MongoDB Atlas**, featuring:
- **Landing Page**: Responsive hero section, interactive mockup, enterprise feature cards, and CTAs.
- **User Authentication**: Simple Sign Up and Log In requiring **Email and Password only** with salted bcrypt hashing and JWT tokens.
- **Dashboard**: Authenticated user portal with role badge (`student` / `teacher`), course overview, and session verification.
- **MongoDB Atlas Integration**: Cloud database document storage with Mongoose schemas and unique email validation.

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
│   │   └── User.js          # Mongoose user model with bcrypt pre-save hash
│   ├── controllers/
│   │   └── authController.js# Register, login, and profile controllers
│   ├── routes/
│   │   └── authRoutes.js    # Authentication endpoints (/api/auth)
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
            ├── Navbar.jsx      # Navigation bar & authentication actions
            ├── LandingPage.jsx # Enterprise landing page
            ├── AuthForm.jsx    # Dual-mode Sign Up & Log In form
            └── Dashboard.jsx   # Post-login dashboard & profile preview
```

---

## ☁️ How to Connect MongoDB Atlas

1. **Log in or Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and log in.
2. **Create a Free Cluster**: Click **Create Cluster** (M0 Free Tier).
3. **Set Up Database Access (User)**:
   - In Atlas left sidebar, click **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Create a username (e.g. `alliya`) and password (e.g. `Password123!`). Select **Read and write to any database**.
4. **Set Up Network Access (IP Whitelist)**:
   - In Atlas left sidebar, click **Security** > **Network Access**.
   - Click **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`) -> Click **Confirm**.
5. **Get Your Connection String**:
   - Go to **Deployments** > **Database** > Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It looks like:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/banana_classroom?retryWrites=true&w=majority
     ```
6. **Paste into `server/.env`**:
   Open [`server/.env`](file:///Users/nirushmanshrestha/Documents/Uni%20/ff/26-27-SEM1-CIS046-3-SOFTWARE-FOR-ENTERPRISE/server/.env) and update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://alliya:Password123!@cluster0.abcde.mongodb.net/banana_classroom?retryWrites=true&w=majority
   ```

> 💡 **Notice:** If you don't enter an Atlas string or while you are creating your cluster, the server will automatically use an embedded in-memory development database so you can register, log in, and test immediately without getting blocked!

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

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | No |
| `GET` | `/api/auth/me` | Fetch current user profile | Yes (`Bearer <token>`) |
| `GET` | `/api/health` | Health check endpoint | No |
