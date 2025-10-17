import axios from 'axios';

const API_BASE = 'http://localhost:8081/admin';

export const assignStock = async ({ email, tradingCode, quantity }) => {
  const res = await axios.post(`${API_BASE}/assign-stock`, { email, tradingCode, quantity }, { withCredentials: true });
  return res.data;
};