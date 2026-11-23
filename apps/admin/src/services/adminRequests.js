import { ADMIN_API_BASE as API_BASE } from './config';
import axios from 'axios';



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

export const deleteRequest = async (id) => {
  const res = await axios.delete(`${API_BASE}/requests/${id}`, { withCredentials: true });
  return res.data;
};