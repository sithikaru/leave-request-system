import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, tokenStorage } from '@/lib/axiosInstance';
import { toast } from 'sonner';

// User type definition
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  createdAt: string;
}

// Auth state interface
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; email: string; password: string; role: string }) => Promise<boolean>;
  logout: () => void;
  loadUserFromStorage: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuthStatus: () => Promise<boolean>;
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Login action
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          const response = await api.auth.login({ email, password });
          const { access_token, user } = response.data;
          
          // Store token and user data
          tokenStorage.setToken(access_token);
          tokenStorage.setUser(user);
          
          // Update state
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success(`Welcome back, ${user.name}!`);
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return false;
        }
      },

      // Register action
      register: async (userData: { name: string; email: string; password: string; role: string }): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          const response = await api.auth.register(userData);
          const { access_token, user } = response.data;
          
          // Store token and user data
          tokenStorage.setToken(access_token);
          tokenStorage.setUser(user);
          
          // Update state
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          toast.success(`Welcome, ${user.name}! Your account has been created.`);
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          return false;
        }
      },

      // Logout action
      logout: () => {
        tokenStorage.removeToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        toast.success('Logged out successfully');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // Load user from storage (for app initialization)
      loadUserFromStorage: () => {
        const token = tokenStorage.getToken();
        const user = tokenStorage.getUser();
        
        if (token && user) {
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Update user data
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          tokenStorage.setUser(updatedUser);
          set({ user: updatedUser });
        }
      },

      // Check authentication status
      checkAuthStatus: async (): Promise<boolean> => {
        const token = tokenStorage.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        try {
          set({ isLoading: true });
          const response = await api.auth.getProfile();
          const user = response.data;
          
          // Update user data in case it changed on the server
          tokenStorage.setUser(user);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          // Token is invalid, clear everything
          tokenStorage.removeToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hooks for common auth operations
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus,
  };
};

// Role-based permission hooks
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  
  return {
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    hasRole: (role: 'admin' | 'manager' | 'employee') => user?.role === role,
    canAccessAdminPanel: user?.role === 'admin',
    canApproveRequests: user?.role === 'manager' || user?.role === 'admin',
    canManageUsers: user?.role === 'admin',
  };
};
