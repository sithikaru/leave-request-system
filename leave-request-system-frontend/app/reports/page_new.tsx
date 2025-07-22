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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports'>('analytics');
  
  const [filters, setFilters] = useState({
    timeRange: '3m',
    startDate: '',
    endDate: '',
    leaveType: 'all',
    status: 'all',
    employeeId: 'all',
  });

  const [reportFilters, setReportFilters] = useState({
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      fetchEmployees();
      applyFilters();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const response = await api.users.getAll();
      setEmployees(response.data.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
      })));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const applyFilters = async () => {
    setIsLoading(true);
    try {
      const filterParams: any = {};
      
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.leaveType !== 'all') filterParams.leaveType = filters.leaveType;
      if (filters.status !== 'all') filterParams.status = filters.status;
      if (filters.employeeId !== 'all') filterParams.employeeId = parseInt(filters.employeeId);

      const response = await api.analytics.getAnalytics(filterParams);
      setAnalyticsData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      timeRange: '3m',
      startDate: '',
      endDate: '',
      leaveType: 'all',
      status: 'all',
      employeeId: 'all',
    });
  };

  const handleExportAnalytics = async () => {
    try {
      await exportToPDF('analytics-dashboard', 'analytics-report.pdf');
      toast.success('Analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics report');
    }
  };

  const handleDownloadReport = async (reportType: 'requests' | 'balances', format: 'excel' | 'pdf' = 'excel') => {
    setIsLoading(true);
    try {
      let response;
      if (reportType === 'requests') {
        const filterParams = {
          ...(reportFilters.type !== 'all' && { type: reportFilters.type }),
          ...(reportFilters.status !== 'all' && { status: reportFilters.status }),
          ...(reportFilters.startDate && { startDate: reportFilters.startDate }),
          ...(reportFilters.endDate && { endDate: reportFilters.endDate }),
        };
        if (format === 'pdf') {
          response = await api.leaveRequests.downloadLeaveReportPDF(filterParams);
        } else {
          response = await api.leaveRequests.downloadLeaveReport(filterParams);
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

  if (!user || user.role === 'employee') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-gray-500">Only managers and administrators can access analytics and reports.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive leave management insights and data exports</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div id="analytics-dashboard" className="space-y-6">
            {/* Filters */}
            <AnalyticsFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
              employees={employees}
              userRole={user.role as 'manager' | 'admin'}
            />

            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading analytics...</p>
              </div>
            )}

            {analyticsData && !isLoading && (
              <>
                {/* Export Button */}
                <div className="flex justify-end">
                  <Button onClick={handleExportAnalytics}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Analytics (PDF)
                  </Button>
                </div>

                {/* Summary Stats */}
                <SummaryStats stats={analyticsData.totalStats} />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Leave Type Distribution */}
                  <Card>
                    <CardContent className="p-6">
                      <PieChartComponent
                        data={analyticsData.leaveTypeDistribution.map(item => ({
                          name: item.type,
                          value: item.count
                        }))}
                        title="Leave Type Distribution"
                        colors={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']}
                      />
                    </CardContent>
                  </Card>

                  {/* Leave Status Distribution */}
                  <Card>
                    <CardContent className="p-6">
                      <PieChartComponent
                        data={analyticsData.leaveStatusDistribution.map(item => ({
                          name: item.status,
                          value: item.count
                        }))}
                        title="Leave Status Distribution"
                        colors={['#10B981', '#F59E0B', '#EF4444', '#6B7280']}
                      />
                    </CardContent>
                  </Card>

                  {/* Monthly Leave Trends */}
                  <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                      <LineChartComponent
                        data={analyticsData.monthlyLeaveData}
                        title="Monthly Leave Trends"
                        xDataKey="month"
                        lines={[
                          { dataKey: 'annual', name: 'Annual', color: '#0088FE' },
                          { dataKey: 'sick', name: 'Sick', color: '#00C49F' },
                          { dataKey: 'personal', name: 'Personal', color: '#FFBB28' },
                          { dataKey: 'emergency', name: 'Emergency', color: '#FF8042' },
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Department Leave Data */}
                  <Card>
                    <CardContent className="p-6">
                      <BarChartComponent
                        data={analyticsData.departmentLeaveData}
                        title="Department Leave Statistics"
                        xDataKey="department"
                        bars={[
                          { dataKey: 'totalRequests', name: 'Total Requests', color: '#0088FE' },
                          { dataKey: 'approvedRequests', name: 'Approved', color: '#00C49F' },
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Leave Balance Distribution */}
                  <Card>
                    <CardContent className="p-6">
                      <BarChartComponent
                        data={analyticsData.leaveBalanceData}
                        title="Employee Leave Balance Distribution"
                        xDataKey="balanceRange"
                        bars={[
                          { dataKey: 'employeeCount', name: 'Employees', color: '#8884D8' },
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Manager Performance (if available) */}
                  {analyticsData.managerPerformance.length > 0 && (
                    <Card className="lg:col-span-2">
                      <CardContent className="p-6">
                        <BarChartComponent
                          data={analyticsData.managerPerformance}
                          title="Manager Performance Metrics"
                          xDataKey="managerName"
                          bars={[
                            { dataKey: 'approvalRate', name: 'Approval Rate (%)', color: '#00C49F' },
                            { dataKey: 'avgResponseTime', name: 'Avg Response Time (days)', color: '#FF8042' },
                          ]}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Leave Requests Report</h3>
                      <p className="text-sm text-gray-600">Download detailed leave request reports</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleDownloadReport('requests', 'excel')}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleDownloadReport('requests', 'pdf')}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Leave Balances Report</h3>
                      <p className="text-sm text-gray-600">Export current leave balance data</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleDownloadReport('balances', 'excel')}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleDownloadReport('balances', 'pdf')}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
