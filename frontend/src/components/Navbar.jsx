// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

// motion-enhanced Link
const MotionLink = motion(Link);

export default function Navbar({ authed, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();          // notify App to clear `authed` and token & redirect
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 12 }}
    >
      <div className="container">
        <MotionLink
          to="/"
          className="navbar-brand"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          Ruwa Meter System
        </MotionLink>

        <motion.button
          className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          whileTap={{ scale: 0.9 }}
        >
          <span /><span /><span />
        </motion.button>

        <AnimatePresence initial={false}>
          {(isMenuOpen || window.innerWidth > 768) && (
            <motion.div
              className="nav-links"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
            >
              {[
                { to: '/',      label: 'Home' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/sessions',  label: 'Sessions' },
              ].map(({ to, label }) => (
                <MotionLink
                  key={to}
                  to={to}
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                  whileHover={{ y: -2, scale: 1.05 }}
                >
                  {label}
                </MotionLink>
              ))}

              {authed ? (
                <motion.button
                  className="nav-link logout-button"
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              ) : (
                <MotionLink
                  to="/login"
                  className="nav-link login-button"
                  onClick={() => setIsMenuOpen(false)}
                  whileHover={{ scale: 1.05 }}
                >
                  Login
                </MotionLink>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
