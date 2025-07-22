import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// API base URL - can be configured via environment variables
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },
  
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getUser: (): any | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  setUser: (user: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Request interceptor to add authentication token
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          tokenStorage.removeToken();
          toast.error('Session expired. Please login again.');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Requested resource not found.');
          break;
          
        case 500:
          toast.error('Internal server error. Please try again later.');
          break;
          
        default:
          // Handle other error codes
          const message = response.data?.message || 'An unexpected error occurred.';
          toast.error(message);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection and try again.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API helper methods
export const api = {
  // Authentication endpoints
  auth: {
    login: (credentials: { email: string; password: string }) => 
      axiosInstance.post('/auth/login', credentials),
    
    register: (userData: { name: string; email: string; password: string; role: string }) => 
      axiosInstance.post('/auth/register', userData),
    
    getProfile: () => 
      axiosInstance.get('/auth/profile'),
  },
  
  // User management endpoints
  users: {
    getAll: () => 
      axiosInstance.get('/users'),
    
    getById: (id: number) => 
      axiosInstance.get(`/users/${id}`),
    
    create: (userData: { name: string; email: string; password: string; role: string }) => 
      axiosInstance.post('/users', userData),
    
    update: (id: number, userData: Partial<{ name: string; email: string; role: string; emailNotifications: boolean }>) => 
      axiosInstance.patch(`/users/${id}`, userData),
    
    delete: (id: number) => 
      axiosInstance.delete(`/users/${id}`),
  },
  
  // Leave request endpoints
  leaveRequests: {
    // Get user's own requests
    getMy: () => 
      axiosInstance.get('/leave-request'),
    
    // Get all requests (manager/admin)
    getAll: () => 
      axiosInstance.get('/leave-request/all'),
    
    // Get specific request by ID
    getById: (id: number) => 
      axiosInstance.get(`/leave-request/${id}`),
    
    // Submit new request
    create: (requestData: { 
      type: string; 
      startDate: string; 
      endDate: string; 
      duration?: string;
      reason: string; 
    }) => 
      axiosInstance.post('/leave-request', requestData),
    
    // Update request
    update: (id: number, requestData: { 
      type?: string; 
      startDate?: string; 
      endDate?: string; 
      duration?: string;
      reason?: string; 
    }) => 
      axiosInstance.patch(`/leave-request/${id}`, requestData),
    
    // Approve request
    approve: (id: number, comments?: string) => 
      axiosInstance.patch(`/leave-request/${id}/approve`, { comments }),
    
    // Reject request
    reject: (id: number, comments: string) => 
      axiosInstance.patch(`/leave-request/${id}/reject`, { comments }),
    
    // Cancel request
    cancel: (id: number) => 
      axiosInstance.patch(`/leave-request/${id}/cancel`),
    
    // Delete request (admin only)
    delete: (id: number) => 
      axiosInstance.delete(`/leave-request/${id}`),

    // Reports
    downloadLeaveReport: (filters: any) =>
      axiosInstance.get('/leave-request/reports/leave-report', { 
        params: filters,
        responseType: 'blob'
      }),

    downloadBalanceReport: () =>
      axiosInstance.get('/leave-request/reports/balance-report', {
        responseType: 'blob'
      }),

    downloadLeaveReportPDF: (filters: any) =>
      axiosInstance.get('/leave-request/reports/leave-report-pdf', { 
        params: filters,
        responseType: 'blob'
      }),

    downloadBalanceReportPDF: () =>
      axiosInstance.get('/leave-request/reports/balance-report-pdf', {
        responseType: 'blob'
      }),

    // Public Holidays
    getPublicHolidays: (country?: string, year?: number) =>
      axiosInstance.get('/public-holidays', { 
        params: { country, year } 
      }),

    getCountries: () =>
      axiosInstance.get('/public-holidays/countries'),

    fetchHolidays: (country: string, year: number) =>
      axiosInstance.get(`/public-holidays/fetch/${country}/${year}`),

    createPublicHoliday: (holidayData: {
      name: string;
      date: string;
      description?: string;
      country?: string;
    }) =>
      axiosInstance.post('/public-holidays', holidayData),

    updatePublicHoliday: (id: number, holidayData: {
      name?: string;
      date?: string;
      description?: string;
      isActive?: boolean;
    }) =>
      axiosInstance.patch(`/public-holidays/${id}`, holidayData),

    deletePublicHoliday: (id: number) =>
      axiosInstance.delete(`/public-holidays/${id}`),
  },

  // Paid Leave endpoints
  paidLeave: {
    // Grant paid leave (managers/admins only)
    create: (paidLeaveData: {
      employeeId: number;
      type: string;
      days: number;
      reason: string;
      notes?: string;
      deductFromBalance: boolean;
    }) =>
      axiosInstance.post('/paid-leave', paidLeaveData),

    // Get all granted paid leaves (managers/admins)
    getAll: () =>
      axiosInstance.get('/paid-leave'),

    // Get my granted paid leaves
    getMy: () =>
      axiosInstance.get('/paid-leave/my'),

    // Get paid leaves for specific employee
    getByEmployee: (employeeId: number) =>
      axiosInstance.get(`/paid-leave/employee/${employeeId}`),

    // Get stats for employee
    getStats: (employeeId: number) =>
      axiosInstance.get(`/paid-leave/stats/${employeeId}`),

    // Get specific paid leave record
    getById: (id: number) =>
      axiosInstance.get(`/paid-leave/${id}`),

    // Update paid leave record
    update: (id: number, updateData: {
      type?: string;
      days?: number;
      reason?: string;
      notes?: string;
      deductFromBalance?: boolean;
    }) =>
      axiosInstance.patch(`/paid-leave/${id}`, updateData),

    // Delete paid leave record (admin only)
    delete: (id: number) =>
      axiosInstance.delete(`/paid-leave/${id}`),
  },

  // Analytics endpoints
  analytics: {
    // Get analytics data (managers and admins)
    getAnalytics: (filters: {
      startDate?: string;
      endDate?: string;
      departmentId?: number;
      employeeId?: number;
      leaveType?: string;
      status?: string;
    } = {}) =>
      axiosInstance.get('/analytics', { params: filters }),

    // Get employee-specific analytics
    getEmployeeAnalytics: (filters: {
      startDate?: string;
      endDate?: string;
    } = {}) =>
      axiosInstance.get('/analytics/employee', { params: filters }),
  },
};

// Export the configured axios instance for custom requests
export default axiosInstance;
