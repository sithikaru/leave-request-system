import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Clock, CheckCircle, XCircle, Users, BarChart3 } from 'lucide-react';

interface SummaryStatsProps {
  stats: {
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

export const SummaryStats: React.FC<SummaryStatsProps> = ({ stats }) => {
  const approvalRate = stats.totalRequests > 0 ? Math.round((stats.totalApproved / stats.totalRequests) * 100) : 0;
  
  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Approved',
      value: stats.totalApproved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending',
      value: stats.totalPending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Rejected',
      value: stats.totalRejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg. Request Days',
      value: stats.averageRequestDays,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg. Response Time',
      value: `${stats.averageResponseTime} days`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Popular Leave Type',
      value: stats.mostPopularLeaveType,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="text-2xl font-bold">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
