import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// Pages
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import ResultsPage from "./pages/ResultsPage";
import PaperDetails from "./pages/PaperDetails";
import CitationsPage from "./pages/CitationsPage";
import ReferencesPage from "./pages/ReferencesPage";
import RelatedPapersPage from "./pages/RelatedPapersPage";
import UserProfile from "./pages/UserProfile";
import UserLibrary from "./pages/UserLibrary";
import Bibtex from "./pages/Bibtex";
import LoginRegister from "./pages/LoginRegister";
import VerifyEmail from "./pages/VerifyEmail"; 

// Search routing helper
function SearchRouteSwitch() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const q = params.get("q");
  return q ? <ResultsPage /> : <SearchResults />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/register" element={<LoginRegister />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Default landing page */}
        <Route path="/" element={<Home />} />

        {/* Core routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchRouteSwitch />} />
        <Route path="/paper/:paperId" element={<PaperDetails />} />
        <Route path="/citations/:paperId" element={<CitationsPage />} />
        <Route path="/references/:paperId" element={<ReferencesPage />} />
        <Route path="/related/:paperId" element={<RelatedPapersPage />} />
        <Route path="/bibtex" element={<Bibtex />} />

        {/* User routes */}
        <Route path="/profile" element={<UserProfile />} />
         <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/library" element={<UserLibrary />} />
      </Routes>
    </Router>
  );
}

export default App;