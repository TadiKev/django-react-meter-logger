import React, { useState } from 'react';
import './SessionForm.css';

export default function SessionForm() {
  const [sessionName, setSessionName] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSession = {
      sessionName,
      date,
      status
    };
    console.log("New Session Submitted:", newSession);
    // You would send this data to the backend here
  };

  return (
    <div className="session-form-container">
      <h2>Create New Meter Reading Session</h2>
      <form onSubmit={handleSubmit} className="session-form">
        <label>
          Session Name:
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            required
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <button type="submit">Save Session</button>
      </form>
    </div>
  );
}
