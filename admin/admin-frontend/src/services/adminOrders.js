import axios from 'axios';

const API_BASE = 'http://localhost:8081/admin';

export const deleteAllOrders = async () => {
  const res = await axios.delete(`${API_BASE}/orders`, { withCredentials: true });
  return res.data;
};