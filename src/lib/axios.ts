import axios from 'axios';

// ✅ Create a pre-configured instance
const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/` || 'https://api.example.com/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Optional: Attach interceptors (auth, error handling, etc.)
api.interceptors.request.use(
  (config) => {
    // Example: add token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
