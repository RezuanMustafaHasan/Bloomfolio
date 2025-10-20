import axios from 'axios';

const API_BASE = 'http://localhost:8081/admin';

export const startBulkFetch = async () => {
  const res = await axios.post(`${API_BASE}/bulk-fetch`, {}, { withCredentials: true });
  return res.data;
};

export const getBulkFetchProgress = async () => {
  const res = await axios.get(`${API_BASE}/bulk-fetch/progress`, { withCredentials: true });
  return res.data;
};

export const stopBulkFetch = async () => {
  const res = await axios.post(`${API_BASE}/bulk-fetch/stop`, {}, { withCredentials: true });
  return res.data;
};