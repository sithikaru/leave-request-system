'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, CalendarDays, Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">Leave Request System</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your organization's leave management with our comprehensive, 
            role-based system designed for modern workplaces.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure access control with Employee, Manager, and Admin roles. 
                Each role has specific permissions and capabilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CalendarDays className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Smart Leave Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit, track, and manage leave requests with multiple types: 
                Annual, Sick, Maternity, Paternity, Emergency, and Personal leave.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                JWT-based authentication, secure API endpoints, and comprehensive 
                audit trails for all leave activities.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Access your account or create a new one to begin managing leave requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/register')} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
