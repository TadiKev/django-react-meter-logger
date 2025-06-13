// src/components/MeterReadingSystem.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MeterReadingSheet.module.css';
import api from '../api';

const MeterReadingSystem = () => {
  const [userName, setUserName] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    id: null,
    date: '',
    suburb: '',
    sequenceStart: '',
    sequenceEnd: '',
    readings: [{ standNumber: '', readingText: '' }],
  });

  const navigate = useNavigate();

  // Load reader name, session metadata, and existing session if any
  useEffect(() => {
    const storedName = localStorage.getItem('readerName');
    const storedMeta = JSON.parse(localStorage.getItem('sessionMeta') || 'null');

    if (storedName && storedMeta) {
      setUserName(storedName);
      setCurrentSession(s => ({ ...s, ...storedMeta }));

      api
        .get('sessions/', { params: { date: storedMeta.date } })
        .then(res => {
          const found = res.data.find(
            sess => sess.reader_name === storedName && sess.date === storedMeta.date
          );
          if (found) {
            setCurrentSession({
              id: found.id,
              date: found.date,
              suburb: String(found.suburb),
              sequenceStart: String(found.sequence_start),
              sequenceEnd: String(found.sequence_end),
              readings: found.readings.map(r => ({
                standNumber: r.stand_number,
                readingText: String(r.consumption),
              })),
            });
          }
        })
        .catch(() => {
          // ignore
        });
    } else {
      setSetupRequired(true);
    }
  }, []);

  // Save setup metadata
  const saveSetup = ({ name, date, suburb, sequenceStart, sequenceEnd }) => {
    const meta = { date, suburb, sequenceStart, sequenceEnd };
    localStorage.setItem('readerName', name);
    localStorage.setItem('sessionMeta', JSON.stringify(meta));
    setUserName(name);
    setCurrentSession(s => ({ ...s, ...meta }));
    setSetupRequired(false);
  };

  // Change a reading field
  const handleReadingChange = (idx, key, val) =>
    setCurrentSession(s => ({
      ...s,
      readings: s.readings.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      ),
    }));

  // Manually add a blank row
  const addReadingRow = () =>
    setCurrentSession(s => ({
      ...s,
      readings: [...s.readings, { standNumber: '', readingText: '' }],
    }));

  // After each save, prepare a new blank row for next entry
  const prepareForNext = () => {
    setCurrentSession(s => ({
      ...s,
      readings: [...s.readings, { standNumber: '', readingText: '' }],
    }));
  };

  // Create or update session, then auto-append new row
  const saveSession = async () => {
    const { id, date, suburb, sequenceStart, sequenceEnd, readings } = currentSession;

    // Build base payload
    const base = {
      date,
      suburb: parseInt(suburb, 10),
      sequence_start: parseInt(sequenceStart, 10),
      sequence_end: parseInt(sequenceEnd, 10),
    };

    let payload;
    if (id) {
      // EXISTING SESSION → only append the one *new* reading
      const last = readings[readings.length - 1];
      payload = {
        ...base,
        readings: [
          {
            stand_number: last.standNumber,
            consumption: parseFloat(last.readingText),
            status: 'normal',
          },
        ],
      };
    } else {
      // NEW SESSION → send all readings
      payload = {
        ...base,
        readings: readings.map(r => ({
          stand_number: r.standNumber,
          consumption: parseFloat(r.readingText),
          status: 'normal',
        })),
      };
    }

    console.log('→ Saving payload:', payload);

    try {
      let response;
      if (id) {
        response = await api.put(`sessions/${id}/`, payload);
      } else {
        response = await api.post('sessions/', payload);
      }
      const saved = response.data;
      setCurrentSession(s => ({
        ...s,
        id: saved.id,
        readings: saved.readings.map(r => ({
          standNumber: r.stand_number,
          readingText: String(r.consumption),
        })),
      }));
      alert(`Session ${id ? 'updated' : 'saved'} successfully!`);
      prepareForNext();
    } catch (err) {
      console.error(err.response || err.message);
      alert(err.response?.data?.detail || 'Error saving session');
    }
  };

  const goToSessionList = () => navigate('/sessions');

  // Setup modal
  if (setupRequired) {
    let temp = { name: '', date: '', suburb: '', sequenceStart: '', sequenceEnd: '' };
    return (
      <div className={styles.nameModal}>
        <h2>Setup Reader & Session</h2>
        <div className={styles.modalForm}>
          <div className={styles.field}>
            <label>Your Name *</label>
            <input type="text" placeholder="Your name" onChange={e => (temp.name = e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Date *</label>
            <input type="date" onChange={e => (temp.date = e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Suburb *</label>
            <select onChange={e => (temp.suburb = e.target.value)}>
              <option value="">Select suburb</option>
              <option value="1">Zimre Park</option>
              <option value="2">Damofalls</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label>Seq Start *</label>
              <input type="number" onChange={e => (temp.sequenceStart = e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Seq End *</label>
              <input type="number" onChange={e => (temp.sequenceEnd = e.target.value)} />
            </div>
          </div>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() =>
            temp.name && temp.date && temp.suburb && temp.sequenceStart && temp.sequenceEnd
              ? saveSetup(temp)
              : alert('Please fill all setup fields.')
          }
        >
          Start Session
        </button>
      </div>
    );
  }

  // Main meter reading UI
  return (
    <div className={styles.container}>
      <section className={styles.main}>
        <header className={styles.header}>
          <h1>Ruwa Local Board</h1>
          <h2>Meter Reading</h2>
          <div className={styles.profile}>
            <span>Reader: <strong>{userName}</strong></span>
            <span>Date: <strong>{currentSession.date}</strong></span>
            <span>Suburb: <strong>{currentSession.suburb}</strong></span>
            <span>Seq: <strong>{currentSession.sequenceStart}–{currentSession.sequenceEnd}</strong></span>
            <button className={styles.editName} onClick={() => setSetupRequired(true)}>
              Edit Setup
            </button>
          </div>
        </header>

        <form className={styles.form} onSubmit={e => { e.preventDefault(); saveSession(); }}>
          <div className={styles.readingsSection}>
            <h3>Readings</h3>
            <table className={styles.table}>
              <thead>
                <tr><th>Stand #</th><th>Reading</th></tr>
              </thead>
              <tbody>
                {currentSession.readings.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={r.standNumber} placeholder="Stand#" onChange={e => handleReadingChange(i, 'standNumber', e.target.value)} />
                    </td>
                    <td>
                      <input
                        value={r.readingText} placeholder="Reading" onChange={e => handleReadingChange(i, 'readingText', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className={styles.addRowBtn} onClick={addReadingRow}>
              + Add Row
            </button>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryBtn}>
              {currentSession.id ? 'Update Session' : 'Save Session'}
            </button>
            <button
              type="button" className={styles.secondaryBtn} onClick={() => setCurrentSession(s => ({ ...s, readings: [{ standNumber: '', readingText: '' }] }))}
            >
              Clear
            </button>
          </div>
        </form>

        <div className={styles.redirectBtnContainer}>
          <button className={styles.primaryBtn} onClick={goToSessionList}>
            View Sessions
          </button>
        </div>
      </section>
    </div>
  );
};

export default MeterReadingSystem;