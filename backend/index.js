const express = require("express");
const cors = require("cors");
require('dotenv').config();

const { supabase } = require('./config/supabase');
const connectDB = require('./config/mongodb');
const userRoutes = require('./routes/userRoutes');
const paperRoutes = require('./routes/paperRoutes');
const libraryRoutes = require('./routes/libraryRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Novara Backend API is running!",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      papers: "/api/papers"
    }
  });
});

// Routes 
app.use('/api/users', userRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/libraries', libraryRoutes);

// 404 handler - Must come AFTER all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});