
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import MeterReadingSheet from './pages/MeterReadingSheet';
import NotFound from './pages/NotFound';
import './styles/main.css';

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  // If we’re not authenticated, redirect to /login
  useEffect(() => {
    if (!authed && window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [authed, navigate]);

  const handleAuthSuccess = () => {
    setAuthed(true);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    // clear token, flip flag, go to login
    localStorage.removeItem('token');
    setAuthed(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-wrapper">
      {/* Nav always knows authed state & how to log out */}
      <Navbar authed={authed} onLogout={handleLogout} />

      <main className="app-content container">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={<LoginForm onAuthSuccess={handleAuthSuccess} />}
          />

          <Route
            path="/dashboard"
            element={
              authed
                ? <Dashboard onLogout={handleLogout} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/sessions"
            element={
              authed
                ? <MeterReadingSheet onLogout={handleLogout} />
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/sessions/new"
            element={
              authed
                ? <MeterReadingSheet onLogout={handleLogout} />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
