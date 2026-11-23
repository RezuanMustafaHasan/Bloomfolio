import { API_BASE } from './config';
import axios from 'axios';



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