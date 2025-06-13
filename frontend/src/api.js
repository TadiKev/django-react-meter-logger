import axios from 'axios';

const token = localStorage.getItem('token');
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  },
});

export default api;
