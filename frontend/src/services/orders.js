import axios from 'axios';

const API_BASE = (import.meta.env.VITE_BACKEND_BASE || 'http://localhost:8080') + '/api';

export const listOrders = async ({ tradingCode, orderType }) => {
  const res = await axios.get(`${API_BASE}/orders`, {
    params: { tradingCode, orderType },
    withCredentials: true,
  });
  return res.data;
};

export const placeOrder = async ({ tradingCode, orderType, askingPrice, quantity }) => {
  const res = await axios.post(`${API_BASE}/orders`, {
    tradingCode, orderType, askingPrice, quantity
  }, { withCredentials: true });
  return res.data;
};