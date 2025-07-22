"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { usePermissions } from "@/lib/authStore";

interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  description?: string;
  isActive: boolean;
}

export default function PublicHolidaysPage() {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    description: "",
  });
  const { canAccessAdminPanel } = usePermissions();

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await api.leaveRequests.getPublicHolidays();
      setHolidays(response.data);
    } catch (error) {
      toast.error("Failed to load public holidays");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.leaveRequests.createPublicHoliday(newHoliday);
      toast.success("Public holiday added successfully!");
      setNewHoliday({ name: "", date: "", description: "" });
      setShowAddForm(false);
      loadHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add public holiday");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Public Holidays
            </h1>
            <p className="text-muted-foreground">View company public holidays and plan your leave</p>
          </div>
          {canAccessAdminPanel && (
            <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          )}
        </div>

        {/* Add Holiday Form */}
        {showAddForm && canAccessAdminPanel && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Public Holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Holiday Name *</Label>
                    <Input
                      id="name"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      placeholder="e.g., Christmas Day"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newHoliday.description}
                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                    placeholder="Optional description or notes"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Holiday</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Holidays List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holidays.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No public holidays configured</p>
                {canAccessAdminPanel && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowAddForm(true)}
                  >
                    Add First Holiday
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            holidays.map((holiday) => (
              <Card key={holiday.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{holiday.name}</CardTitle>
                    {isUpcoming(holiday.date) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {formatDate(holiday.date)}
                  </CardDescription>
                </CardHeader>
                {holiday.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{holiday.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
