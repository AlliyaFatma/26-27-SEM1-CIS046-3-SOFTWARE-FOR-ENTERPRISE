const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

// Initialize MongoDB connection
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow frontend requests
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// Health check and root endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Banana Classroom API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Banana Classroom API</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #fffdf0;">
        <h1>🍌 Banana Classroom Backend API</h1>
        <p>The backend server is running smoothly.</p>
        <p>Endpoints:</p>
        <ul style="list-style: none; padding: 0;">
          <li><code>POST /api/auth/register</code> - Sign up new user</li>
          <li><code>POST /api/auth/login</code> - Log in user</li>
          <li><code>GET /api/auth/me</code> - Get current user profile (requires Bearer token)</li>
          <li><code>GET /api/health</code> - API Health Check</li>
        </ul>
      </body>
    </html>
  `);
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Banana Classroom Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
});
