"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Globe, Download, RefreshCw } from "lucide-react";
import { usePermissions } from "@/lib/authStore";

interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  description?: string;
  country: string;
  isActive: boolean;
}

interface Country {
  code: string;
  name: string;
}

export default function PublicHolidaysPage() {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('LK'); // Default to Sri Lanka
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [newHoliday, setNewHoliday] = useState({
    name: "",
    date: "",
    description: "",
    country: "LK",
  });
  const { canAccessAdminPanel } = usePermissions();

  useEffect(() => {
    loadCountries();
    loadHolidays();
  }, [selectedCountry, selectedYear]);

  const loadCountries = async () => {
    try {
      const response = await api.leaveRequests.getCountries();
      setCountries(response.data);
    } catch (error) {
      toast.error("Failed to load countries");
    }
  };

  const loadHolidays = async () => {
    try {
      setIsLoading(true);
      const response = await api.leaveRequests.getPublicHolidays(selectedCountry, selectedYear);
      setHolidays(response.data);
    } catch (error) {
      toast.error("Failed to load public holidays");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidaysFromAPI = async () => {
    try {
      setIsFetching(true);
      await api.leaveRequests.fetchHolidays(selectedCountry, selectedYear);
      toast.success("Holidays fetched successfully!");
      loadHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch holidays");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.leaveRequests.createPublicHoliday(newHoliday);
      toast.success("Holiday added successfully!");
      setNewHoliday({ name: "", date: "", description: "", country: selectedCountry });
      setShowAddForm(false);
      loadHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      await api.leaveRequests.deletePublicHoliday(id);
      toast.success("Holiday deleted successfully!");
      loadHolidays();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete holiday");
    }
  };

  const generateCalendarDays = () => {
    const year = selectedYear;
    const months = [];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);
        days.push({ day, date: dateStr, holiday });
      }

      months.push({
        name: firstDay.toLocaleDateString('en-US', { month: 'long' }),
        days
      });
    }

    return months;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading holidays...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const calendarMonths = generateCalendarDays();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Public Holidays</h1>
            <p className="text-gray-600">View and manage public holidays by country</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="country">Country:</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="year">Year:</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canAccessAdminPanel && (
              <Button 
                onClick={fetchHolidaysFromAPI} 
                disabled={isFetching}
                variant="outline"
              >
                {isFetching ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Fetch from API
              </Button>
            )}

            {canAccessAdminPanel && (
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Add Holiday Form */}
        {showAddForm && canAccessAdminPanel && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Holiday Name *</Label>
                    <Input
                      id="name"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., New Year's Day"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newHoliday.description}
                    onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Holiday
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {calendarMonths.map((month, monthIndex) => (
              <Card key={monthIndex}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{month.name} {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-xs font-medium text-gray-500 text-center p-1">
                        {day}
                      </div>
                    ))}
                    {month.days.map((dayData, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`
                          text-center p-1 text-sm relative
                          ${dayData ? 'hover:bg-gray-50' : ''}
                          ${dayData?.holiday ? 'bg-red-50 text-red-700 font-medium rounded' : ''}
                        `}
                        title={dayData?.holiday ? dayData.holiday.name : ''}
                      >
                        {dayData?.day || ''}
                        {dayData?.holiday && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {countries.find(c => c.code === selectedCountry)?.name || selectedCountry} Holidays {selectedYear}
              </CardTitle>
              <CardDescription>
                {holidays.length} holidays found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No holidays found for the selected country and year.</p>
                  {canAccessAdminPanel && (
                    <p className="text-sm">Try fetching holidays from the API or add them manually.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{holiday.name}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            {holiday.description && (
                              <p className="text-sm text-gray-600 mt-1">{holiday.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{holiday.country}</Badge>
                        {canAccessAdminPanel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Public Holidays
            </h1>
            <p className="text-gray-600">View company public holidays and plan your leave</p>
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
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">No public holidays configured</p>
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
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
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
                    <p className="text-sm text-gray-600">{holiday.description}</p>
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
