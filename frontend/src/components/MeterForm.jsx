import React, { useEffect, useState } from 'react';
import styles from './MeterForm.module.css';
import api from '../api';

export default function MeterForm() {
  const [suburbs, setSuburbs] = useState([]);
  const [session, setSession] = useState({
    reader_name: '',
    date: '',
    suburb: '',
    sequence_start: '',
    sequence_end: '',
    readings: [{ stand_number: '', reading_text: '' }],
  });

  useEffect(() => {
    async function fetchSuburbs() {
      try {
        const res = await fetch('/api/suburbs/');
        const data = await res.json();
        console.log('Fetched suburbs:', data);
        setSuburbs(data);
      } catch (err) {
        console.error('Failed to load suburbs', err);
      }
    }
    fetchSuburbs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    if (name === 'sequence_start' || name === 'sequence_end') {
      parsedValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(parsedValue)) parsedValue = '';
    }
    console.log(`Field change - ${name}:`, parsedValue);
    setSession((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleReadingChange = (idx, e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === 'stand_number') {
      parsedValue = value === '' ? '' : parseInt(value, 10);
      if (isNaN(parsedValue)) parsedValue = '';
    } else if (name === 'reading_text') {
      parsedValue = parseFloat(value) || '';
    }

    console.log(`Reading[${idx}] change - ${name}:`, parsedValue);

    setSession((prev) => ({
      ...prev,
      readings: prev.readings.map((r, i) =>
        i === idx ? { ...r, [name]: parsedValue } : r
      ),
    }));
  };

  const addReading = () => {
    console.log('Adding new reading field');
    setSession((prev) => ({
      ...prev,
      readings: [...prev.readings, { stand_number: '', reading_text: '' }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      ...session,
      suburb: session.suburb ? parseInt(session.suburb, 10) : '',
      sequence_start: session.sequence_start,
      sequence_end: session.sequence_end,
      readings: session.readings.map((r) => ({
        stand_number: r.stand_number.toString(),
        reading_text: r.reading_text,
      })),
    };

    console.log('Submitting data:', postData);

    try {
      const response = await api.post('sessions/', postData);
      console.log('API Response:', response);
      alert('Saved!');
      setSession({
        reader_name: '',
        date: '',
        suburb: '',
        sequence_start: '',
        sequence_end: '',
        readings: [{ stand_number: '', reading_text: '' }],
      });
    } catch (err) {
      console.error('Error submitting data:', err);
      alert('Error saving readings');
    }
  };

  return (
    <form className={styles.meterForm} onSubmit={handleSubmit}>
      <h2>Meter Reading Session</h2>

      <label className={styles.label}>
        Reader Name *
        <input
          className={styles.input}
          name="reader_name"
          type="text"
          value={session.reader_name}
          onChange={handleChange}
          required
        />
      </label>

      <label className={styles.label}>
        Date *
        <input
          className={styles.input}
          name="date"
          type="date"
          value={session.date}
          onChange={handleChange}
          required
        />
      </label>

      <label className={styles.label}>
        Suburb *
        <select
          className={styles.input}
          name="suburb"
          value={session.suburb}
          onChange={handleChange}
          required
        >
          <option value="">Select suburb</option>
          {suburbs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        Sequence Start *
        <input
          className={styles.input}
          name="sequence_start"
          type="number"
          value={session.sequence_start}
          onChange={handleChange}
          required
        />
      </label>

      <label className={styles.label}>
        Sequence End *
        <input
          className={styles.input}
          name="sequence_end"
          type="number"
          value={session.sequence_end}
          onChange={handleChange}
          required
        />
      </label>

      <h3>Stand Readings</h3>
      {session.readings.map((r, idx) => (
        <div key={idx} className={styles.readingField}>
          <input
            className={styles.input}
            name="stand_number"
            placeholder="Stand #"
            type="number"
            value={r.stand_number}
            onChange={(e) => handleReadingChange(idx, e)}
            required
          />
          <input
            className={styles.input}
            name="reading_text"
            placeholder="Reading"
            type="number"
            step="0.01"
            value={r.reading_text}
            onChange={(e) => handleReadingChange(idx, e)}
            required
          />
        </div>
      ))}

      <button
        type="button"
        className={styles.secondaryButton}
        onClick={addReading}
      >
        + Add Reading
      </button>
      <button type="submit" className={styles.primaryButton}>
        Submit
      </button>
    </form>
  );
}
