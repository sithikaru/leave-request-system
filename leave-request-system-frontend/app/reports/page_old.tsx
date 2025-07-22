"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useAuth } from "@/lib/authStore";
import { Download, FileSpreadsheet, FileText, BarChart3, TrendingUp } from "lucide-react";

// Analytics Components
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { SummaryStats } from "@/components/analytics/SummaryStats";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { LineChartComponent } from "@/components/analytics/LineChartComponent";
import { exportToPDF } from "@/lib/exportUtils";

interface AnalyticsData {
  leaveTypeDistribution: { type: string; count: number; percentage: number }[];
  leaveStatusDistribution: { status: string; count: number; percentage: number }[];
  monthlyLeaveData: { month: string; annual: number; sick: number; personal: number; emergency: number; total: number }[];
  quarterlyTrends: { quarter: string; approved: number; rejected: number; pending: number }[];
  departmentLeaveData: { department: string; totalRequests: number; approvedRequests: number; averageDays: number }[];
  topLeaveUsers: { employeeName: string; totalDays: number; totalRequests: number }[];
  leaveBalanceData: { balanceRange: string; employeeCount: number }[];
  managerPerformance: { managerName: string; avgResponseTime: number; approvalRate: number; totalRequests: number }[];
  totalStats: {
    totalRequests: number;
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    averageRequestDays: number;
    averageResponseTime: number;
    mostPopularLeaveType: string;
    peakLeaveMonth: string;
  };
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    format: 'excel'
  });

  const handleDownloadReport = async (reportType: 'requests' | 'balances', format: 'excel' | 'pdf' = 'excel') => {
    setIsLoading(true);
    try {
      let response;
      if (reportType === 'requests') {
        const filters = {
          ...(reportFilters.type !== 'all' && { type: reportFilters.type }),
          ...(reportFilters.status !== 'all' && { status: reportFilters.status }),
          ...(reportFilters.startDate && { startDate: reportFilters.startDate }),
          ...(reportFilters.endDate && { endDate: reportFilters.endDate }),
        };
        if (format === 'pdf') {
          response = await api.leaveRequests.downloadLeaveReportPDF(filters);
        } else {
          response = await api.leaveRequests.downloadLeaveReport(filters);
        }
      } else {
        if (format === 'pdf') {
          response = await api.leaveRequests.downloadBalanceReportPDF();
        } else {
          response = await api.leaveRequests.downloadBalanceReport();
        }
      }
      
      // Create blob and download
      const mimeType = format === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
      
      const blob = new Blob([response.data], { type: mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${reportType === 'requests' ? 'Leave Requests' : 'Leave Balances'} report downloaded successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Download leave reports and view analytics</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Leave Requests</h3>
                  <p className="text-sm text-gray-600">Download detailed leave request reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Leave Balances</h3>
                  <p className="text-sm text-gray-600">Export current leave balance data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Analytics</h3>
                  <p className="text-sm text-gray-600">View trends and insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Configure filters for your reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="type">Leave Type</Label>
                <Select 
                  value={reportFilters.type} 
                  onValueChange={(value) => setReportFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={reportFilters.status} 
                  onValueChange={(value) => setReportFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Leave Requests Report</span>
              </CardTitle>
              <CardDescription>
                Export detailed leave request data including employee information, dates, status, and comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>• Employee details and leave request information</p>
                  <p>• Date ranges and duration calculations</p>
                  <p>• Status and approval information</p>
                  <p>• Manager comments and approval dates</p>
                </div>
                <Button 
                  onClick={() => handleDownloadReport('requests', 'excel')}
                  disabled={isLoading}
                  className="w-full mb-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isLoading ? 'Downloading...' : 'Download Excel Report'}
                </Button>
                <Button 
                  onClick={() => handleDownloadReport('requests', 'pdf')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isLoading ? 'Downloading...' : 'Download PDF Report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Leave Balances Report</span>
              </CardTitle>
              <CardDescription>
                Export current leave balance information for all employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>• Employee personal information</p>
                  <p>• Current leave balances by type</p>
                  <p>• Annual leave entitlements</p>
                  <p>• Used vs. remaining leave days</p>
                </div>
                <Button 
                  onClick={() => handleDownloadReport('balances', 'excel')}
                  disabled={isLoading}
                  className="w-full mb-2"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isLoading ? 'Downloading...' : 'Download Excel Report'}
                </Button>
                <Button 
                  onClick={() => handleDownloadReport('balances', 'pdf')}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isLoading ? 'Downloading...' : 'Download PDF Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Future Features */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Additional reporting features in development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">Visual Analytics</h4>
                  <p className="text-sm text-gray-500">Interactive charts and graphs for leave trends analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">Scheduled Reports</h4>
                  <p className="text-sm text-gray-500">Automated report generation and email delivery</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
