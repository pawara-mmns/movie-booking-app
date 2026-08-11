import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminMovies from './pages/AdminMovies';
import AdminScreens from './pages/AdminScreens';
import AdminShowtimes from './pages/AdminShowtimes';
import BookingPage from './pages/BookingPage';
import MovieBrowser from './pages/MovieBrowser';
import MovieDetails from './pages/MovieDetails';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading session...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background text-white flex items-center justify-center">Loading session...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
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

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/movies" element={<AdminRoute><AdminMovies /></AdminRoute>} />
          <Route path="/admin/screens" element={<AdminRoute><AdminScreens /></AdminRoute>} />
          <Route path="/admin/showtimes" element={<AdminRoute><AdminShowtimes /></AdminRoute>} />

          <Route path="/booking/:showtimeId" element={<BookingPage />} />
          <Route path="/movies/:movieId" element={<MovieDetails />} />

          <Route path="/" element={<MovieBrowser />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
