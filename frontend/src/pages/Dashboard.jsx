import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { FaTint, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const SESSIONS_PER_PAGE = 5;

export default function Dashboard({ onLogout }) {
  const [dashboardData, setDashboardData] = useState({
    summary: [],
    trendData: [],
    sessions: [],
    locationStats: []
  });
  const [readerName, setReaderName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterSuburb, setFilterSuburb] = useState('');
  const [filterReader, setFilterReader] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setReaderName(localStorage.getItem('username') || '');

    async function loadData() {
      try {
        const res = await api.get('dashboard-data/');
        const data = res.data;

        setDashboardData({
          summary: [
            { label: 'Active Meters', value: data.summary.active_meters, icon: <FaTint /> },
            { label: 'Readings Today', value: data.summary.readings_today, icon: <FaChartLine /> },
            { label: 'Alerts', value: data.summary.alerts, icon: <FaExclamationTriangle /> },
          ],
          trendData: data.trend_data.map(i => ({ date: i.date, total_consumption: i.total_consumption })),
          sessions: data.sessions,
          locationStats: data.location_stats
        });
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.detail || 'Failed to load data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.reload();
        }
      }
    }

    loadData();
  }, []);

  const suburbOptions = useMemo(
    () => [...new Set(dashboardData.sessions.map(s => s.suburb))],
    [dashboardData.sessions]
  );

  const filteredSessions = useMemo(() =>
    dashboardData.sessions.filter(s =>
      (!filterDate || s.date === filterDate) &&
      (!filterSuburb || s.suburb === filterSuburb) &&
      (!filterReader || s.reader_name.toLowerCase().includes(filterReader.toLowerCase()))
    ), [dashboardData.sessions, filterDate, filterSuburb, filterReader]
  );

  const groupedSessions = useMemo(() => {
    const grouped = {};
    filteredSessions.forEach(sess => {
      if (!grouped[sess.reader_name]) {
        grouped[sess.reader_name] = [];
      }
      grouped[sess.reader_name].push(sess);
    });
    return grouped;
  }, [filteredSessions]);

  const totalPages = Math.ceil(Object.keys(groupedSessions).length / SESSIONS_PER_PAGE);
  const paginatedReaders = useMemo(() => {
    const readerNames = Object.keys(groupedSessions);
    return readerNames.slice((currentPage - 1) * SESSIONS_PER_PAGE, currentPage * SESSIONS_PER_PAGE);
  }, [groupedSessions, currentPage]);

  const barData = dashboardData.locationStats.map(loc => ({
    location: loc.suburb,
    consumption: loc.consumption
  }));

  // 🔘 Action Handlers
  const handleNewSession = () => navigate('/session/new');
  const handleUploadCSV = () => toast.info('CSV upload not implemented yet');
  const handleGenerateReport = () => toast.info('Report generation not implemented yet');

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <motion.div className="summary-cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {dashboardData.summary.map(item => (
          <motion.div key={item.label} className="summary-card" whileHover={{ scale: 1.03 }}>
            <div className="icon">{item.icon}</div>
            <div className="value">{item.value}</div>
            <div className="label">{item.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="panels">
        <motion.section className="chart-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2>Consumption Trends (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartTooltip />
              <Legend />
              <Line type="monotone" dataKey="total_consumption" name="Consumed" stroke="#0D9488" />
            </LineChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section className="chart-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2>Water Consumption by Suburb</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <RechartTooltip />
              <Legend />
              <Bar dataKey="consumption" name="Consumed" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }} />
        <select value={filterSuburb} onChange={e => { setFilterSuburb(e.target.value); setCurrentPage(1); }}>
          <option value="">All Suburbs</option>
          {suburbOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
        <input type="text" placeholder="Filter Reader" value={filterReader} onChange={e => { setFilterReader(e.target.value); setCurrentPage(1); }} />
      </div>

      {/* Grouped Sessions */}
      <div className="session-cards">
        {paginatedReaders.length === 0 && <p className="no-sessions">No sessions found.</p>}
        {paginatedReaders.map(reader => (
          <div key={reader} className="reader-group">
            <h3 className="reader-heading">Reader: {reader}</h3>
            {groupedSessions[reader].map(sess => (
              <motion.div
                key={sess.id}
                className="session-card"
                whileHover={{ y: -4 }}
                onClick={() => setSelectedSession(sess)}
              >
                <div><strong>Date:</strong> {sess.date}</div>
                <div><strong>Suburb:</strong> {sess.suburb}</div>
                <div><strong># Readings:</strong> {sess.readings_count}</div>
                <div><strong>Total m³:</strong> {sess.total_consumption}</div>
                <div>
                  <strong>Alerts:</strong>{' '}
                  {sess.alert_count > 0
                    ? <span className="alert">{sess.alert_count} ⚠️</span>
                    : <span className="normal">0 ✅</span>}
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSession(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={e => e.stopPropagation()}>
              <h3>Session Details: {selectedSession.date}</h3>
              <ul>
                {selectedSession.readings?.map((r, idx) => (
                  <li key={idx}>
                    <strong>{r.stand_number}</strong>: {r.consumption} m³
                    {r.status === 'alert' && <span className="alert"> ⚠️</span>}
                  </li>
                ))}
              </ul>
              <button onClick={() => setSelectedSession(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="reader-info">
        Logged in as: <strong>{readerName}</strong>
      </div>
      <div className="quick-actions">
        <button onClick={onLogout}>Logout</button>
        <button onClick={handleNewSession}>New Session</button>
        <button onClick={handleUploadCSV}>Upload CSV</button>
        <button onClick={handleGenerateReport}>Generate Report</button>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}
