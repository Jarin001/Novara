const express = require("express");
const cors = require("cors");
require('dotenv').config();

const { supabase } = require('./config/supabase');
const connectDB = require('./config/mongodb');
const userRoutes = require('./routes/userRoutes');
const paperRoutes = require('./routes/paperRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const autocompleteRoute = require("./routes/autocompleteRoute");
const paperSearchRoute = require("./routes/papersearch.route");
const paperDetailsRoute = require("./routes/paperdetails.route");
const paperCitationsRoute = require("./routes/paper-citations.route");
const paperReferencesRoute= require("./routes/paper-references.route");
const relatedPapersRoute= require("./routes/related-papers.route");
const citationRoutes = require("./routes/citation.route");
const paperaiRoute= require("./routes/paperAi.route");


app.use(express.json());

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
app.use('/api/auth', authRoutes);
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


//autocomplete route
app.use("/api/autocomplete", autocompleteRoute);

//paper-search route
app.use("/api/papers", paperSearchRoute);

//paper-details route
app.use("/api/papers", paperDetailsRoute);

//route to get citations of a paper
app.use("/api/papers", paperCitationsRoute);

// route to get papers cited by a paper
app.use("/api/papers", paperReferencesRoute);

//route to get related papers of a papaer
app.use("/api/papers", relatedPapersRoute)

//citation generation route
app.use('/api/citations', citationRoutes);

//paper-ai route
app.use("/api/paper-ai", paperaiRoute);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});