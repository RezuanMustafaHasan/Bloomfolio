import { ADMIN_API_BASE as API_BASE } from './config';
import axios from 'axios';



export const assignStock = async ({ email, tradingCode, quantity }) => {
  const res = await axios.post(`${API_BASE}/assign-stock`, { email, tradingCode, quantity }, { withCredentials: true });
  return res.data;
};