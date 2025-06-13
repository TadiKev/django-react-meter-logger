/* Home.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <section className="home">
      <div className="content">
        <h1 className="title">Welcome to Ruwa Meter Reading</h1>
        <p className="subtitle">Manage your water consumption efficiently</p>
        <p className="tagline">Empowering Communities, One Drop at a Time</p>
        <Link to="/dashboard" className="btn btn-primary">
          View Dashboard
        </Link>
      </div>
      <div className="water-wave"></div>
    </section>
  );
}
