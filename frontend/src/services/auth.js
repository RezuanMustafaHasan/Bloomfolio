import axios from 'axios';

const API_BASE = 'http://localhost:8080';

export const signup = async ({ name, email, password }) => {
  const res = await axios.post(`${API_BASE}/signup`, {
    name,
    email,
    password,
    createdAt: new Date(),
  }, { withCredentials: true });
  return res.data;
};

export const login = async ({ email, password }) => {
  const res = await axios.post(`${API_BASE}/login`, {
    email,
    password,
  }, { withCredentials: true });
  return res.data;
};