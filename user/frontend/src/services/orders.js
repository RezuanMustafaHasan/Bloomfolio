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

export const executeOrder = async (orderId) => {
  const res = await axios.post(`${API_BASE}/order/execute/${orderId}`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

export const myOrders = async () => {
  const res = await axios.get(`${API_BASE}/orders/mine`, { withCredentials: true });
  return res.data;
};

export const resubmitOrder = async (orderId, { orderType, askingPrice, quantity, tradingCode }) => {
  const payload = {};
  if (orderType) payload.orderType = orderType;
  if (askingPrice !== undefined) payload.askingPrice = askingPrice;
  if (quantity !== undefined) payload.quantity = quantity;
  if (tradingCode) payload.tradingCode = tradingCode;
  const res = await axios.post(`${API_BASE}/orders/${orderId}/resubmit`, payload, { withCredentials: true });
  return res.data;
};

export const deleteOrder = async (orderId) => {
  const res = await axios.delete(`${API_BASE}/orders/${orderId}`, {
    withCredentials: true,
  });
  return res.data;
};