const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://www.the-leadlab.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock backend is running' });
});

// API v1 routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'API v1 is working' });
});

// LinkedIn related endpoints
app.get('/api/v1/linkedin/profile', (req, res) => {
  res.json({
    id: '12345',
    name: 'Test User',
    headline: 'Software Developer',
    location: 'San Francisco, CA'
  });
});

app.post('/api/v1/linkedin/connect', (req, res) => {
  res.json({
    success: true,
    message: 'Connection request sent successfully'
  });
});

// Catch all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`Mock backend server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API v1 health: http://localhost:${PORT}/api/v1/health`);
});