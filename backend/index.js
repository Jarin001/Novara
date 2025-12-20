const express = require("express");
const { supabase } = require('./config/supabase');
const connectDB = require('./config/mongodb');
const app = express();


const autocompleteRoute = require("./routes/autocompleteRoute");
const paperSearchRoute = require("./routes/papersearch.route");
const citationRoutes = require('./routes/citation.route');


app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});



//autocomplete route
app.use("/api/autocomplete", autocompleteRoute);

//paper-search route
app.use("/api/papersearch", paperSearchRoute);

//citation-route
app.use('/api/citations', citationRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
