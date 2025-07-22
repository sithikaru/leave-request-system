"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw } from 'lucide-react';

interface AnalyticsFiltersProps {
  filters: {
    timeRange: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    status: string;
    employeeId: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  employees?: { id: number; name: string }[];
  userRole: 'employee' | 'manager' | 'admin';
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  employees = [],
  userRole,
}) => {
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '3m':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        return;
    }
    
    onFilterChange('startDate', start.toISOString().split('T')[0]);
    onFilterChange('endDate', end.toISOString().split('T')[0]);
  };

  const handleTimeRangeChange = (range: string) => {
    onFilterChange('timeRange', range);
    if (range !== 'custom') {
      getDateRange(range);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Time Range */}
          <div>
            <Label htmlFor="timeRange">Time Range</Label>
            <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          {filters.timeRange === 'custom' && (
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
              />
            </div>
          )}

          {/* End Date */}
          {filters.timeRange === 'custom' && (
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
              />
            </div>
          )}

          {/* Leave Type */}
          <div>
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={filters.leaveType} onValueChange={(value) => onFilterChange('leaveType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="emergency">Emergency Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="paternity">Paternity Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Selection (for managers and admins) */}
          {userRole !== 'employee' && employees.length > 0 && (
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={filters.employeeId} onValueChange={(value) => onFilterChange('employeeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button onClick={onApplyFilters} size="sm">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={onResetFilters} size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
