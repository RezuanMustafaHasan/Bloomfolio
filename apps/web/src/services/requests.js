import { API_BASE } from './config';
import axios from 'axios';

const API_URL = API_BASE + '/api';

export const submitRequest = async ({ requestedAmount, transactionId }) => {
  const res = await axios.post(`${API_URL}/requests`, { requestedAmount, transactionId }, { withCredentials: true });
  return res.data;
};

export const myRequests = async () => {
  const res = await axios.get(`${API_URL}/requests/mine`, { withCredentials: true });
  return res.data;
};