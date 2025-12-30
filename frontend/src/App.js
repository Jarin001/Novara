import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import UserLibrary from './pages/UserLibrary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserLibrary />} />
        <Route path="/profile" element={<UserLibrary />} />
        {/* Add more routes here as you create more pages */}
        {/* <Route path="/search" element={<Search />} /> */}
      </Routes>
    </Router>
  );
}

export default App;