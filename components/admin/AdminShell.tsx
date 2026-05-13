"use client";

import { useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminShellProps {
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  children: React.ReactNode;
}

export default function AdminShell({ admin, children }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main Content Area */}
      <div
        className="transition-all duration-300 lg:ml-[280px]"
        style={{
          marginLeft: undefined,
        }}
        data-collapsed={isCollapsed}
      >
        <style jsx>{`
          div[data-collapsed="true"] {
            margin-left: 72px;
          }
          div[data-collapsed="false"] {
            margin-left: 280px;
          }
          @media (max-width: 1023px) {
            div[data-collapsed="true"],
            div[data-collapsed="false"] {
              margin-left: 0;
            }
          }
        `}</style>

        {/* Header */}
        <AdminHeader admin={admin} onMobileMenuToggle={handleMobileMenuToggle} />

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
