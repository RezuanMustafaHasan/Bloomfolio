import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes to allow long AI responses
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

// AI chat API
export const aiAPI = {
  chat: async ({ tradingCodes, question, model }) => {
    try {
      const response = await apiClient.post('/api/ai/chat', {
        tradingCodes,
        question,
        model,
      }, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error calling AI chat:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.response?.data?.error || error.message || 'AI chat failed',
        error: error.response?.data?.error || error.message,
      };
    }
  },
};

export default apiClient;