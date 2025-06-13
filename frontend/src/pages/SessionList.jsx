import React from 'react';
import { Link } from 'react-router-dom';
import './SessionList.css';

export default function SessionList() {
  return (
    <div className="session-page">
      <div className="session-header">
        <h2>Meter Reading Sessions</h2>
        <Link to="/sessions/new" className="btn btn-primary">Add New Session</Link>
      </div>

      <div className="session-list">
        {/* This would later be a mapped list from your database */}
        <div className="session-card">
          <h3>Session #001</h3>
          <p>Date: 2025-04-20</p>
          <p>Status: Completed</p>
        </div>

        <div className="session-card">
          <h3>Session #002</h3>
          <p>Date: 2025-04-23</p>
          <p>Status: In Progress</p>
        </div>
      </div>
    </div>
  );
}
