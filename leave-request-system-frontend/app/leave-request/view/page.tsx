"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { FileText, Eye, X, Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface LeaveRequest {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  duration?: string;
  totalDays?: number;
  approver?: {
    name: string;
  };
  approvalComments?: string;
  approvedAt?: string;
}

interface LeaveBalance {
  annualLeave: number;
  sickLeave: number;
  personalLeave: number;
  emergencyLeave: number;
}

export default function ViewLeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const response = await api.auth.getProfile();
      const user = response.data;
      setLeaveBalance({
        annualLeave: user.annualLeaveBalance || 21,
        sickLeave: user.sickLeaveBalance || 10,
        personalLeave: user.personalLeaveBalance || 5,
        emergencyLeave: user.emergencyLeaveBalance || 3,
      });
    } catch (error: any) {
      console.error("Failed to fetch leave balance:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.leaveRequests.getMy();
      setRequests(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await api.leaveRequests.cancel(requestId);
      toast.success("Leave request cancelled successfully");
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Leave Balance Summary */}
        {leaveBalance && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>Your current leave quota and remaining days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Annual Leave</h3>
                  <p className="text-2xl font-bold text-blue-600">{leaveBalance.annualLeave}</p>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Sick Leave</h3>
                  <p className="text-2xl font-bold text-green-600">{leaveBalance.sickLeave}</p>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900">Personal Leave</h3>
                  <p className="text-2xl font-bold text-purple-600">{leaveBalance.personalLeave}</p>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900">Emergency Leave</h3>
                  <p className="text-2xl font-bold text-red-600">{leaveBalance.emergencyLeave}</p>
                  <p className="text-sm text-gray-600">days remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
            <p className="text-gray-600">View and manage your leave request history</p>
          </div>
          <Link href="/leave-request/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request History</CardTitle>
            <CardDescription>
              All your leave requests with current status and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No leave requests</h3>
                <p className="mt-1 text-gray-500">
                  You haven't submitted any leave requests yet.
                </p>
                <div className="mt-6">
                  <Link href="/leave-request/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Your First Request
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium capitalize">
                            {request.type.replace("_", " ")} Leave
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center text-gray-900">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(request.startDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-gray-500 mt-1">
                              to {new Date(request.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {request.totalDays || calculateDays(request.startDate, request.endDate)} day
                            {(request.totalDays || calculateDays(request.startDate, request.endDate)) !== 1 ? "s" : ""}
                            {request.duration && (
                              <div className="text-xs text-gray-500 mt-1">
                                ({request.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'})
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>                              <DialogTitle>
                                {selectedRequest ? `${selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)} Leave Request` : 'Leave Request'}
                              </DialogTitle>
                                  <DialogDescription>
                                    Request details and status information
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedRequest && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Start Date</Label>
                                        <p className="text-sm text-gray-900">
                                          {new Date(selectedRequest.startDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">End Date</Label>
                                        <p className="text-sm text-gray-900">
                                          {new Date(selectedRequest.endDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Duration</Label>
                                      <p className="text-sm text-gray-900">
                                        {selectedRequest.totalDays || calculateDays(selectedRequest.startDate, selectedRequest.endDate)} day
                                        {(selectedRequest.totalDays || calculateDays(selectedRequest.startDate, selectedRequest.endDate)) !== 1 ? "s" : ""}
                                        {selectedRequest.duration && (
                                          <span className="ml-2 text-xs text-gray-500">
                                            ({selectedRequest.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'})
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Reason</Label>
                                      <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <div className="mt-1">
                                        <Badge className={getStatusColor(selectedRequest.status)}>
                                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                                        </Badge>
                                      </div>
                                    </div>
                                    {selectedRequest.approver && (
                                      <div>
                                        <Label className="text-sm font-medium">Reviewed By</Label>
                                        <p className="text-sm text-gray-900">{selectedRequest.approver.name}</p>
                                      </div>
                                    )}
                                    {selectedRequest.approvalComments && (
                                      <div>
                                        <Label className="text-sm font-medium">Comments</Label>
                                        <p className="text-sm text-gray-900">{selectedRequest.approvalComments}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-sm font-medium">Submitted</Label>
                                      <p className="text-sm text-gray-900">
                                        {new Date(selectedRequest.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            {request.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelRequest(request.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-lg font-bold">
                      {requests.filter(r => r.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-lg font-bold">
                      {requests.filter(r => r.status === "approved").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-lg font-bold">
                      {requests.filter(r => r.status === "rejected").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-lg font-bold">{requests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
