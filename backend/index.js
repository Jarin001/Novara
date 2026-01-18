const express = require("express");
const { supabase } = require('./config/supabase');
const connectDB = require('./config/mongodb');
const app = express();

connectDB();

const autocompleteRoute = require("./routes/autocompleteRoute");
const paperSearchRoute = require("./routes/papersearch.route");
const paperDetailsRoute = require("./routes/paperdetails.route");
const paperCitationsRoute = require("./routes/paper-citations.route");
const paperReferencesRoute= require("./routes/paper-references.route");
const relatedPapersRoute= require("./routes/related-papers.route");
const citationRoutes = require("./routes/citation.route");
const libraryBibtexRoute = require('./routes/libraryBibtex.route');
const allPaperBibtexRoute = require('./routes/all-paper-bibtex-route');
const paperAiRoutes = require("./routes/paperAi.route");


app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running!");
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
app.use("/api/paper-ai", paperAiRoutes);

//library-bibtex route
app.use('/api/libraries', libraryBibtexRoute);

//all-paper-bibtex route
app.use('/api/libraries', allPaperBibtexRoute);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
