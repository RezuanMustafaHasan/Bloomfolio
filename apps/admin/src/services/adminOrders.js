import { ADMIN_API_BASE as API_BASE } from './config';
import axios from 'axios';



export const deleteAllOrders = async () => {
  const res = await axios.delete(`${API_BASE}/orders`, { withCredentials: true });
  return res.data;
};