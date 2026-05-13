"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url: string };
  };
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <DashboardSidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        user={user}
      />

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {/* Header */}
        <DashboardHeader
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          user={user}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
