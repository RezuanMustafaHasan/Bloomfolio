import axios from 'axios';

const API_BASE = 'http://localhost:8081/admin';

export const listRequests = async ({ status = 'Pending', q = '', sort = 'createdAt:desc' } = {}) => {
  const res = await axios.get(`${API_BASE}/requests`, { params: { status, q, sort }, withCredentials: true });
  return res.data;
};

export const acceptRequest = async (id) => {
  const res = await axios.post(`${API_BASE}/requests/${id}/accept`, {}, { withCredentials: true });
  return res.data;
};

export const rejectRequest = async (id, reason = '') => {
  const res = await axios.post(`${API_BASE}/requests/${id}/reject`, { reason }, { withCredentials: true });
  return res.data;
};

export const modifyRequest = async (id, newAmount) => {
  const res = await axios.post(`${API_BASE}/requests/${id}/modify`, { newAmount }, { withCredentials: true });
  return res.data;
};