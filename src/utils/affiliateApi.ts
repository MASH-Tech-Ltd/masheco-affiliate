import axios from 'axios';

export const affiliateApi = axios.create({
  baseURL: '/api/affiliate',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

affiliateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      window.location.pathname.startsWith('/dashboard')
    ) {
      localStorage.removeItem('affiliate_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

