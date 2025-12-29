import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfile from './pages/UserProfile';
import LoginRegister from './pages/LoginRegister';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegister />} />
        <Route path="/login" element={<LoginRegister />} />
        <Route path="/profile" element={<UserProfile />} />
        {/* Add more routes here as you create more pages */}
        {/* <Route path="/search" element={<Search />} /> */}
      </Routes>
    </Router>
  );
}

export default App;