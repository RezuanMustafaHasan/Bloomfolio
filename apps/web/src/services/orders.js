import { API_BASE } from './config';
import axios from 'axios';

const API_URL = API_BASE + '/api';

export const listOrders = async ({ tradingCode, orderType }) => {
  const res = await axios.get(`${API_URL}/orders`, {
    params: { tradingCode, orderType },
    withCredentials: true,
  });
  return res.data;
};

export const placeOrder = async ({ tradingCode, orderType, askingPrice, quantity }) => {
  const res = await axios.post(`${API_URL}/orders`, {
    tradingCode, orderType, askingPrice, quantity
  }, { withCredentials: true });
  return res.data;
};

export const executeOrder = async (orderId) => {
  const res = await axios.post(`${API_URL}/order/execute/${orderId}`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

export const myOrders = async () => {
  const res = await axios.get(`${API_URL}/orders/mine`, { withCredentials: true });
  return res.data;
};

export const resubmitOrder = async (orderId, { orderType, askingPrice, quantity, tradingCode }) => {
  const payload = {};
  if (orderType) payload.orderType = orderType;
  if (askingPrice !== undefined) payload.askingPrice = askingPrice;
  if (quantity !== undefined) payload.quantity = quantity;
  if (tradingCode) payload.tradingCode = tradingCode;
  const res = await axios.post(`${API_URL}/orders/${orderId}/resubmit`, payload, { withCredentials: true });
  return res.data;
};

export const deleteOrder = async (orderId) => {
  const res = await axios.delete(`${API_URL}/orders/${orderId}`, {
    withCredentials: true,
  });
  return res.data;
};