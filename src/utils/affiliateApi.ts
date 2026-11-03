import axios from 'axios';

export const affiliateApi = axios.create({
  baseURL: '/api/affiliate',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

affiliateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Ignore refresh loop for auth action endpoints
    const isAuthAction =
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/change-password') ||
      url.includes('/refresh-token') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password');

    // Suspended affiliate write attempt notice
    if (error.response?.status === 403 && error.response?.data?.code === 'AFFILIATE_SUSPENDED') {
      if (typeof window !== 'undefined') {
        try {
          const toast = require('react-hot-toast').default || require('react-hot-toast');
          toast.error(
            error.response.data.message ||
              'Your affiliate account is currently suspended. Modifications are disabled in read-only mode.'
          );
        } catch (_) {}
      }
      return Promise.reject(error);
    }

    // 401 handler: attempt silent refresh first, like merchant dashboard
    if (error.response?.status === 401 && !isAuthAction && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return affiliateApi(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/affiliate/refresh-token', {}, { withCredentials: true });
        processQueue(null);
        return affiliateApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('affiliate_user');
          if (
            !window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register') &&
            window.location.pathname.startsWith('/dashboard')
          ) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && !isAuthAction && originalRequest._retry) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('affiliate_user');
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          window.location.pathname.startsWith('/dashboard')
        ) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
