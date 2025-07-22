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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Gift, Plus, User, Calendar, Info } from "lucide-react";

interface PaidLeave {
  id: number;
  employeeId: number;
  employee: {
    id: number;
    name: string;
    email: string;
  };
  granter: {
    id: number;
    name: string;
  };
  type: string;
  days: number;
  reason: string;
  notes?: string;
  deductFromBalance: boolean;
  grantedAt: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
}

const PAID_LEAVE_TYPES = [
  { value: 'bonus', label: 'Bonus Leave', description: 'Reward for good performance' },
  { value: 'compensation', label: 'Compensation Leave', description: 'Compensation for overtime or weekend work' },
  { value: 'award', label: 'Award Leave', description: 'Recognition for achievements' },
  { value: 'other', label: 'Other', description: 'Other paid leave reasons' },
];

export default function AdminPaidLeavesPage() {
  const [paidLeaves, setPaidLeaves] = useState<PaidLeave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState({
    employeeId: 0,
    type: 'bonus',
    days: 1,
    reason: '',
    notes: '',
    deductFromBalance: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [paidLeavesResponse, employeesResponse] = await Promise.all([
        api.paidLeave.getAll(),
        api.users.getAll(),
      ]);
      setPaidLeaves(paidLeavesResponse.data);
      setEmployees(employeesResponse.data.filter((user: Employee) => user.role === 'employee'));
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.paidLeave.create(formData);
      toast.success("Paid leave granted successfully!");
      
      // Reset form
      setFormData({
        employeeId: 0,
        type: 'bonus',
        days: 1,
        reason: '',
        notes: '',
        deductFromBalance: false,
      });
      setShowGrantForm(false);
      setSelectedEmployee(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to grant paid leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === Number(employeeId));
    setSelectedEmployee(employee || null);
    setFormData(prev => ({ ...prev, employeeId: Number(employeeId) }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Grant Paid Leaves</h1>
            <p className="text-gray-600">Grant additional paid leave days to employees</p>
          </div>
          <Button onClick={() => setShowGrantForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Grant Paid Leave
          </Button>
        </div>

        {/* Grant Form Dialog */}
        <Dialog open={showGrantForm} onOpenChange={setShowGrantForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5" />
                <span>Grant Paid Leave</span>
              </DialogTitle>
              <DialogDescription>
                Grant additional paid leave days to an employee
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee">Select Employee *</Label>
                <Select value={formData.employeeId.toString()} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Info Card */}
              {selectedEmployee && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-blue-900">{selectedEmployee.name}</h3>
                        <p className="text-sm text-blue-600">{selectedEmployee.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAID_LEAVE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days *</Label>
                  <Input
                    id="days"
                    type="number"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={formData.days}
                    onChange={(e) => setFormData(prev => ({ ...prev, days: Number(e.target.value) }))}
                    placeholder="1.0"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Outstanding performance in Q4"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information or context"
                  rows={3}
                />
              </div>

              {/* Balance Deduction Option */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <Label htmlFor="deductFromBalance" className="text-sm font-medium">
                          Deduct from Employee Balance
                        </Label>
                      </div>
                      <p className="text-xs text-yellow-700">
                        {formData.deductFromBalance 
                          ? "This leave will be deducted from the employee's balance when used" 
                          : "This leave will be added to the employee's annual leave balance immediately"
                        }
                      </p>
                    </div>
                    <Switch
                      id="deductFromBalance"
                      checked={formData.deductFromBalance}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, deductFromBalance: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowGrantForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Granting..." : "Grant Paid Leave"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Recent Granted Leaves */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Granted Paid Leaves</CardTitle>
            <CardDescription>
              History of paid leaves granted to employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paidLeaves.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No paid leaves have been granted yet.</p>
                <p className="text-sm">Grant your first paid leave to reward employees!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paidLeaves.map((paidLeave) => (
                  <div key={paidLeave.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Gift className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-medium">{paidLeave.employee.name}</h3>
                          <p className="text-sm text-gray-500">{paidLeave.employee.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="secondary">{paidLeave.type}</Badge>
                            <span className="text-sm text-gray-600">
                              {paidLeave.days} day{paidLeave.days !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm text-gray-600">
                              by {paidLeave.granter.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 ml-11">
                        <p className="text-sm text-gray-700">
                          <strong>Reason:</strong> {paidLeave.reason}
                        </p>
                        {paidLeave.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Notes:</strong> {paidLeave.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-sm text-gray-500">
                        {new Date(paidLeave.grantedAt).toLocaleDateString()}
                      </div>
                      <Badge variant={paidLeave.deductFromBalance ? "outline" : "default"}>
                        {paidLeave.deductFromBalance ? "Deductible" : "Added to Balance"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
