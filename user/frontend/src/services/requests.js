import axios from 'axios';

const API_BASE = (import.meta.env.VITE_BACKEND_BASE || 'http://localhost:8080') + '/api';

export const submitRequest = async ({ requestedAmount, transactionId }) => {
  const res = await axios.post(`${API_BASE}/requests`, { requestedAmount, transactionId }, { withCredentials: true });
  return res.data;
};

export const myRequests = async () => {
  const res = await axios.get(`${API_BASE}/requests/mine`, { withCredentials: true });
  return res.data;
};