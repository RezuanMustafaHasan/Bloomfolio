import axios from 'axios';

const API_BASE = 'http://localhost:8081/admin';

export const login = async ({ email, password }) => {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password }, { withCredentials: true });
  return res.data;
};

export const verify = async () => {
  const res = await axios.post(`${API_BASE}/auth/verify`, {}, { withCredentials: true });
  return res.data;
};

export const listUsers = async (q = '') => {
  const res = await axios.get(`${API_BASE}/users`, { params: { q }, withCredentials: true });
  return res.data;
};

export const getUser = async (id) => {
  const res = await axios.get(`${API_BASE}/users/${id}`, { withCredentials: true });
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`${API_BASE}/users/${id}`, { withCredentials: true });
  return res.data;
};