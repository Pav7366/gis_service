import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import MapDashboard from './MapDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/map" element={<MapDashboard />} />
      </Routes>
    </Router>
  );
}