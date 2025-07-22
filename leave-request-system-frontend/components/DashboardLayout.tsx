"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth, usePermissions } from "@/lib/authStore";
import { 
  Home, 
  FileText, 
  Users, 
  CheckSquare, 
  LogOut, 
  Menu,
  Plus,
  BarChart3,
  Settings,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { canAccessAdminPanel, canApproveRequests } = usePermissions();

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      showForRoles: true,
    },
    {
      name: "New Leave Request",
      href: "/leave-request/new",
      icon: Plus,
      showForRoles: user?.role === 'employee',
    },
    {
      name: "My Requests",
      href: "/leave-request/view",
      icon: FileText,
      showForRoles: user?.role === 'employee',
    },
    {
      name: "Approvals",
      href: "/manager/approvals",
      icon: CheckSquare,
      showForRoles: canApproveRequests,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      showForRoles: canApproveRequests,
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: Users,
      showForRoles: canAccessAdminPanel,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      showForRoles: true,
    },
  ];

  const filteredNavigation = navigationItems.filter(item => item.showForRoles);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 
        w-64 bg-card shadow-xl lg:shadow-lg transition-transform duration-300 ease-in-out
        flex flex-col h-full border-r border-border
      `}>
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-blue-600 text-white lg:bg-card lg:text-card-foreground">
          <h1 className="text-xl font-bold">Leave System</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-blue-700 lg:text-card-foreground lg:hover:bg-accent"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground truncate">
                {user.name}
              </p>
              <Badge variant="secondary" className="text-xs mt-1">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-l-4 border-transparent"
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Logout */}
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <header className="bg-card shadow-sm border-b border-border lg:border-l">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-card-foreground truncate">
                {navigationItems.find(item => item.href === pathname)?.name || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium lg:hidden">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
