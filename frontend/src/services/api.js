import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Stock API endpoints
export const stockAPI = {
  // Get all stocks
  getAllStocks: async () => {
    try {
      const response = await apiClient.get('/fetch-all-stocks');
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error) {
      console.error('Error fetching all stocks:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch stocks',
      };
    }
  },

  // Get single stock by trading code
  getStockByCode: async (tradingCode) => {
    try {
      const response = await apiClient.get(`/fetch-details/${tradingCode}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      console.error(`Error fetching stock ${tradingCode}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch stock',
      };
    }
  },
};

export default apiClient;