"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Settings, Mail, User, Save, Calendar } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  emailNotifications: boolean;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  personalLeaveBalance: number;
  emergencyLeaveBalance: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailNotifications: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.auth.getProfile();
      const userData = response.data;
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        emailNotifications: userData.emailNotifications ?? true,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await api.users.update(profile.id, {
        name: formData.name,
        emailNotifications: formData.emailNotifications,
      });
      
      toast.success("Settings updated successfully");
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Failed to load profile</h3>
          <p className="text-gray-500">Please try refreshing the page</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and notification settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email address cannot be changed. Contact administrator if needed.
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about leave request updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive email updates for leave request status changes
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked: boolean) => 
                      setFormData(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    You will receive notifications for:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Leave request submissions (confirmation)</li>
                    <li>• Leave request approvals</li>
                    <li>• Leave request rejections</li>
                    <li>• Important system updates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Leave Balance Overview - Only for Employees */}
          {profile.role === 'employee' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Leave Balance</span>
                  </CardTitle>
                  <CardDescription>
                    Your current leave entitlements and remaining days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Annual Leave</p>
                        <p className="text-xs text-blue-600">Vacation days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900">{profile.annualLeaveBalance ?? 0}</p>
                        <p className="text-xs text-blue-600">days left</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">Sick Leave</p>
                        <p className="text-xs text-green-600">Medical leave</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-900">{profile.sickLeaveBalance ?? 0}</p>
                        <p className="text-xs text-green-600">days left</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Personal Leave</p>
                        <p className="text-xs text-purple-600">Personal time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-900">{profile.personalLeaveBalance ?? 0}</p>
                        <p className="text-xs text-purple-600">days left</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-900">Emergency Leave</p>
                        <p className="text-xs text-red-600">Urgent situations</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-900">{profile.emergencyLeaveBalance ?? 0}</p>
                        <p className="text-xs text-red-600">days left</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Leave balances are updated automatically when requests are approved.
                      Contact HR for any discrepancies.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.role === 'employee' && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/leave-request/new">
                          <Calendar className="mr-2 h-4 w-4" />
                          Submit Leave Request
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/leave-request/view">
                          <User className="mr-2 h-4 w-4" />
                          View My Requests
                        </a>
                      </Button>
                    </>
                  )}
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/public-holidays">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Public Holidays
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Quick Actions for Managers and Admins */}
          {(profile.role === 'manager' || profile.role === 'admin') && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>
                    {profile.role === 'admin' ? 'Administrative functions' : 'Management functions'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.role === 'manager' && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/manager/approvals">
                          <User className="mr-2 h-4 w-4" />
                          Review Pending Approvals
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/reports">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Reports
                        </a>
                      </Button>
                    </>
                  )}
                  {profile.role === 'admin' && (
                    <>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/admin/users">
                          <User className="mr-2 h-4 w-4" />
                          Manage Users
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/manager/approvals">
                          <User className="mr-2 h-4 w-4" />
                          Review Pending Approvals
                        </a>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href="/reports">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Reports
                        </a>
                      </Button>
                    </>
                  )}
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/public-holidays">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Public Holidays
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
