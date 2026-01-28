import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAuctions = async () => {
  try {
    const response = await apiClient.get('/items');
    return {
      success: true,
      data: response.data.data,
      serverTime: response.data.serverTime,
    };
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const fetchAuction = async (auctionId) => {
  try {
    const response = await apiClient.get(`/items/${auctionId}`);
    return {
      success: true,
      data: response.data.data,
      serverTime: response.data.serverTime,
    };
  } catch (error) {
    console.error('Error fetching auction:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const fetchBidHistory = async (auctionId) => {
  try {
    const response = await apiClient.get(`/items/${auctionId}/bid-history`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching bid history:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export default apiClient;
