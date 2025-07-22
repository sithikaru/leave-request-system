"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { Toaster } from '@/components/ui/sonner';

interface AuthProviderProps {
  children: ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register'];

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/leave-request', '/admin', '/manager'];

export default function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, loadUserFromStorage, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from storage
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    // Check auth status when component mounts or route changes
    if (typeof window !== 'undefined') {
      checkAuthStatus();
    }
  }, [checkAuthStatus, pathname]);

  useEffect(() => {
    // Handle route protection
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
      
      if (isProtectedRoute && !isAuthenticated) {
        // Redirect to login if trying to access protected route without auth
        router.push('/login');
      } else if (isPublicRoute && isAuthenticated) {
        // Redirect to dashboard if trying to access public route while authenticated
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
      />
    </>
  );
}
