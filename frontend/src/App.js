import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import ResultsPage from "./pages/ResultsPage";
import PaperDetails from "./pages/PaperDetails";
import CitationsPage from "./pages/CitationsPage";
import ReferencesPage from "./pages/ReferencesPage";
import RelatedPapersPage from "./pages/RelatedPapersPage";
import UserLibrary from './pages/UserLibrary';
import Bibtex from './pages/Bibtex';
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
        <Route path="/paper" element={<PaperDetails />} />
        <Route path="/citations" element={<CitationsPage />} />
        <Route path="/references" element={<ReferencesPage />} />
        <Route path="/related" element={<RelatedPapersPage />} />
        <Route path="/library" element={<UserLibrary />} />
        <Route path="/bibtex" element={<Bibtex />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;