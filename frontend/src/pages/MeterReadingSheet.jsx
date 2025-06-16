// src/components/MeterReadingSystem.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MeterReadingSheet.module.css";
import api from "../api";

const MeterReadingSystem = () => {
  const [userName, setUserName] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [suburbs, setSuburbs] = useState([]);
  const [temp, setTemp] = useState({
    name: "",
    date: "",
    suburbId: "",
    sequenceStart: "",
    sequenceEnd: ""
  });
  const [currentSession, setCurrentSession] = useState({
    id: null,
    date: "",
    suburbId: "",
    suburbName: "",
    sequenceStart: "",
    sequenceEnd: "",
    readings: [{ standNumber: "", readingText: "" }]
  });

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/suburbs/")
      .then(res => setSuburbs(res.data))
      .catch(console.error);

    const storedName = localStorage.getItem("readerName");
    const storedMeta = JSON.parse(localStorage.getItem("sessionMeta") || "null");

    if (storedName && storedMeta) {
      setUserName(storedName);
      setCurrentSession(s => ({
        ...s,
        date: storedMeta.date,
        suburbId: storedMeta.suburbId,
        suburbName: storedMeta.suburbName,
        sequenceStart: storedMeta.sequenceStart,
        sequenceEnd: storedMeta.sequenceEnd
      }));

      api.get("/sessions/", { params: { date: storedMeta.date } })
        .then(res => {
          const found = res.data.find(
            sess => sess.reader_name === storedName && sess.date === storedMeta.date
          );
          if (found) {
            setCurrentSession({
              id: found.id,
              date: found.date,
              suburbId: String(found.suburb),
              suburbName: suburbs.find(s => s.id === found.suburb)?.name || "",
              sequenceStart: String(found.sequence_start),
              sequenceEnd: String(found.sequence_end),
              readings: found.readings.map(r => ({
                standNumber: r.stand_number,
                readingText: String(r.consumption)
              }))
            });
          }
        })
        .catch(() => {});
    } else {
      setSetupRequired(true);
    }
  }, []);

  const handleTempChange = (key, value) => {
    setTemp(prev => ({ ...prev, [key]: value }));
  };

  const saveSetup = () => {
    const { name, date, suburbId, sequenceStart, sequenceEnd } = temp;
    if (!name || !date || !suburbId || !sequenceStart || !sequenceEnd) {
      alert("Please fill all setup fields.");
      return;
    }
    const suburbName = suburbs.find(s => String(s.id) === suburbId)?.name || "";
    localStorage.setItem("readerName", name);
    localStorage.setItem(
      "sessionMeta",
      JSON.stringify({ date, suburbId, suburbName, sequenceStart, sequenceEnd })
    );
    setUserName(name);
    setCurrentSession(s => ({
      ...s,
      date,
      suburbId,
      suburbName,
      sequenceStart,
      sequenceEnd
    }));
    setSetupRequired(false);
  };

  const handleReadingChange = (idx, key, val) => {
    setCurrentSession(s => ({
      ...s,
      readings: s.readings.map((r, i) =>
        i === idx ? { ...r, [key]: val } : r
      )
    }));
  };

  const addReadingRow = () => {
    setCurrentSession(s => ({
      ...s,
      readings: [...s.readings, { standNumber: "", readingText: "" }]
    }));
  };

  const prepareForNext = () => {
    addReadingRow();
  };

  const saveSession = async () => {
    const {
      id,
      date,
      suburbId,
      sequenceStart,
      sequenceEnd,
      readings
    } = currentSession;

    const base = {
      date,
      suburb: parseInt(suburbId, 10),
      sequence_start: parseInt(sequenceStart, 10),
      sequence_end: parseInt(sequenceEnd, 10)
    };

    let payload;
    if (id) {
      const last = readings[readings.length - 1];
      payload = {
        ...base,
        readings: [
          {
            stand_number: last.standNumber,
            consumption: parseFloat(last.readingText),
            status: "normal"
          }
        ]
      };
    } else {
      payload = {
        ...base,
        readings: readings.map(r => ({
          stand_number: r.standNumber,
          consumption: parseFloat(r.readingText),
          status: "normal"
        }))
      };
    }

    try {
      const res = id
        ? await api.put(`sessions/${id}/`, payload)
        : await api.post("sessions/", payload);
      const saved = res.data;
      setCurrentSession(s => ({
        ...s,
        id: saved.id,
        readings: saved.readings.map(r => ({
          standNumber: r.stand_number,
          readingText: String(r.consumption)
        }))
      }));
      alert(`Session ${id ? "updated" : "saved"} successfully!`);
      prepareForNext();
    } catch (err) {
      console.error(err);
      alert("Error saving session");
    }
  };

  const goToSessionList = () => navigate("/sessions");

  if (setupRequired) {
    return (
      <div className={styles.nameModal}>
        <h2>Setup Reader & Session</h2>
        <div className={styles.modalForm}>
          <div className={styles.field}>
            <label>Your Name *</label>
            <input
              type="text"
              placeholder="Your name"
              value={temp.name}
              onChange={e => handleTempChange("name", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Date *</label>
            <input
              type="date"
              value={temp.date}
              onChange={e => handleTempChange("date", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Suburb *</label>
            <select
              value={temp.suburbId}
              onChange={e => handleTempChange("suburbId", e.target.value)}
            >
              <option value="">Select suburb</option>
              {Array.isArray(suburbs)
                ? suburbs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                : null}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label>Seq Start *</label>
              <input
                type="number"
                value={temp.sequenceStart}
                onChange={e =>
                  handleTempChange("sequenceStart", e.target.value)
                }
              />
            </div>
            <div className={styles.field}>
              <label>Seq End *</label>
              <input
                type="number"
                value={temp.sequenceEnd}
                onChange={e =>
                  handleTempChange("sequenceEnd", e.target.value)
                }
              />
            </div>
          </div>
        </div>
        <button className={styles.primaryBtn} onClick={saveSetup}>
          Start Session
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.main}>
        <header className={styles.header}>
          <h1>Ruwa Local Board</h1>
          <h2>Meter Reading</h2>
          <div className={styles.profile}>
            <span>Reader: <strong>{userName}</strong></span>
            <span>Date: <strong>{currentSession.date}</strong></span>
            <span>Suburb: <strong>{currentSession.suburbName}</strong></span>
            <span>
              Seq: <strong>
                {currentSession.sequenceStart}–{currentSession.sequenceEnd}
              </strong>
            </span>
            <button
              className={styles.editName}
              onClick={() => setSetupRequired(true)}
            >
              Edit Setup
            </button>
          </div>
        </header>

        <form
          className={styles.form}
          onSubmit={e => {
            e.preventDefault();
            saveSession();
          }}
        >
          <div className={styles.readingsSection}>
            <h3>Readings</h3>
            <table className={styles.table}>
              <thead>
                <tr><th>Stand #</th><th>Reading</th></tr>
              </thead>
              <tbody>
                {Array.isArray(currentSession.readings)
                  ? currentSession.readings.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            value={r.standNumber}
                            placeholder="Stand#"
                            onChange={e =>
                              handleReadingChange(i, "standNumber", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={r.readingText}
                            placeholder="Reading"
                            onChange={e =>
                              handleReadingChange(i, "readingText", e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
            <button
              type="button"
              className={styles.addRowBtn}
              onClick={addReadingRow}
            >
              + Add Row
            </button>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryBtn}>
              {currentSession.id ? "Update Session" : "Save Session"}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() =>
                setCurrentSession(s => ({
                  ...s,
                  readings: [{ standNumber: "", readingText: "" }]
                }))
              }
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
