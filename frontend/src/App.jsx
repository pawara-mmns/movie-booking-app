import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminMovies from './pages/AdminMovies';
import AdminScreens from './pages/AdminScreens';
import AdminShowtimes from './pages/AdminShowtimes';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import MovieBrowser from './pages/MovieBrowser';
import MovieDetails from './pages/MovieDetails';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Check Dashboard logic: If customer, go to Home. If Admin, go to Admin Dashboard?
// Or just let "Dashboard" be Home for users.
const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/admin" />;
  return <MovieBrowser />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/movies" element={<ProtectedRoute><AdminMovies /></ProtectedRoute>} />
          <Route path="/admin/screens" element={<ProtectedRoute><AdminScreens /></ProtectedRoute>} />
          <Route path="/admin/showtimes" element={<ProtectedRoute><AdminShowtimes /></ProtectedRoute>} />

          <Route path="/booking/:showtimeId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/movies/:movieId" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />

          <Route path="/" element={<Home />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
