import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import ResultsPage from "./pages/ResultsPage";
import CitePage from "./pages/CitePage";
import PaperDetails from "./pages/PaperDetails";
import CitationsPage from "./pages/CitationsPage";
import ReferencesPage from "./pages/ReferencesPage";
import RelatedPapersPage from "./pages/RelatedPapersPage";
import "bootstrap/dist/css/bootstrap.min.css";

function SearchRouteSwitch() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const q = params.get("q");
  return q ? <ResultsPage /> : <SearchResults />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchRouteSwitch />} />
        <Route path="/cite" element={<CitePage />} />
        <Route path="/paper" element={<PaperDetails />} />
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/references" element={<ReferencesPage />} />
        <Route path="/related" element={<RelatedPapersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;