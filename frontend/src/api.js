import axios from 'axios';


const api = axios.create({
  baseURL: '/api/',        
  headers: {
    'Content-Type': 'application/json'
  },
});


const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Token ${token}`;
}

export default api;
