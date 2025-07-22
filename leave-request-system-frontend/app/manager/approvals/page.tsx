"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { 
  CheckSquare, 
  Eye, 
  Check, 
  X, 
  Search, 
  Calendar, 
  Clock, 
  User,
  Filter
} from "lucide-react";

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
  employee: {
    id: number;
    name: string;
    email: string;
  };
  approver?: {
    name: string;
  };
  approvalComments?: string;
  approvedAt?: string;
}

interface ApprovalData {
  status: 'approved' | 'rejected';
  comments: string;
}

export default function ManagerApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalForm, setApprovalForm] = useState<ApprovalData>({
    status: 'approved',
    comments: ''
  });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      // Try to get all requests for manager review
      const response = await api.leaveRequests.getAll();
      setRequests(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: number, comments: string) => {
    try {
      await api.leaveRequests.approve(requestId, comments);
      toast.success("Leave request approved successfully");
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalForm({ status: 'approved', comments: '' });
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: number, comments: string) => {
    try {
      await api.leaveRequests.reject(requestId, comments);
      toast.success("Leave request rejected");
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
      setApprovalForm({ status: 'approved', comments: '' });
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  };

  const handleSubmitApproval = () => {
    if (!selectedRequest) return;
    
    if (approvalForm.status === 'approved') {
      handleApproveRequest(selectedRequest.id, approvalForm.comments);
    } else {
      handleRejectRequest(selectedRequest.id, approvalForm.comments);
    }
  };

  const openViewDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const openApprovalDialog = (request: LeaveRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setApprovalForm({ status: action, comments: '' });
    setIsApprovalDialogOpen(true);
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

  const getUrgency = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) return { label: "Urgent", color: "text-red-600" };
    if (diffDays <= 7) return { label: "Soon", color: "text-orange-600" };
    return { label: "Normal", color: "text-green-600" };
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Request Approvals</h1>
            <p className="text-gray-600">Review and approve employee leave requests</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name, leave type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              Review pending and processed leave requests from your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || statusFilter !== "all" ? "No requests found" : "No leave requests"}
                </h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "There are no leave requests to review at this time"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const urgency = getUrgency(request.startDate);
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {request.employee.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{request.employee.name}</div>
                                <div className="text-sm text-gray-500">{request.employee.email}</div>
                              </div>
                            </div>
                          </TableCell>
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
                            <span className={`text-sm font-medium ${urgency.color}`}>
                              {urgency.label}
                            </span>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewDialog(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openApprovalDialog(request, 'approved')}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openApprovalDialog(request, 'rejected')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                  <Check className="h-4 w-4 text-green-600" />
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
                  <X className="h-4 w-4 text-red-600" />
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
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-lg font-bold">{requests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Request Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Leave Request Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the leave request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Employee</Label>
                    <p className="text-sm text-gray-900">{selectedRequest.employee.name}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.employee.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <p className="text-sm text-gray-900 capitalize">
                      {selectedRequest.type.replace("_", " ")} Leave
                    </p>
                  </div>
                </div>
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

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalForm.status === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </DialogTitle>
              <DialogDescription>
                {approvalForm.status === 'approved' 
                  ? 'Approve this leave request and optionally add comments'
                  : 'Reject this leave request with reason for rejection'
                }
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {selectedRequest.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{selectedRequest.employee.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedRequest.type.replace("_", " ")} Leave - {selectedRequest.totalDays || calculateDays(selectedRequest.startDate, selectedRequest.endDate)} day
                        {(selectedRequest.totalDays || calculateDays(selectedRequest.startDate, selectedRequest.endDate)) !== 1 ? "s" : ""}
                        {selectedRequest.duration && (
                          <span className="ml-1">
                            ({selectedRequest.duration === 'HALF_DAY' ? 'Half Day' : 'Full Day'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedRequest.startDate).toLocaleDateString()} to {new Date(selectedRequest.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label htmlFor="approval-comments">
                    {approvalForm.status === 'approved' ? 'Comments (Optional)' : 'Reason for Rejection'}
                  </Label>
                  <Textarea
                    id="approval-comments"
                    value={approvalForm.comments}
                    onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                    placeholder={
                      approvalForm.status === 'approved' 
                        ? 'Add any comments about the approval...'
                        : 'Please provide a reason for rejecting this request...'
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitApproval}
                className={approvalForm.status === 'approved' ? '' : 'bg-red-600 hover:bg-red-700'}
              >
                {approvalForm.status === 'approved' ? 'Approve Request' : 'Reject Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
