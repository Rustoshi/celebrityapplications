"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Stars,
  CalendarCheck,
  UserCircle,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
  IdCard,
  Crown,
} from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url: string };
  };
}

const navItems = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Browse Celebrities", href: "/dashboard/celebrities", icon: Stars },
      { label: "My Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
      { label: "Fan Cards", href: "/dashboard/fan-cards", icon: IdCard },
      { label: "Memberships", href: "/dashboard/memberships", icon: Crown },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
  user,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#262626]">
        <Link href="/dashboard" className="flex items-center gap-2">
          {collapsed ? (
            <span className="text-2xl font-bold text-gradient-gold">C</span>
          ) : (
            <span className="font-display text-xl font-bold text-gradient-gold">
              {APP_NAME}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <TooltipProvider delayDuration={0}>
          {navItems.map((group) => (
            <div key={group.title} className="mb-6">
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-medium text-[#71717A] uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        active
                          ? "bg-[#C9A96E]/10 text-[#C9A96E] border-l-2 border-[#C9A96E] ml-0 pl-[10px]"
                          : "text-[#A1A1AA] hover:bg-[#C9A96E]/5 hover:text-[#FAFAFA]",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 shrink-0", active && "text-[#C9A96E]")} />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="bg-[#1a1a1a] border-[#262626]">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {/* User Section */}
      <div className="border-t border-[#262626] p-4">
        <Link
          href="/dashboard/profile"
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-[#C9A96E]/5 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border border-[#262626]">
            <AvatarImage src={user.avatar?.url} alt={user.firstName} />
            <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E] text-sm">
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#FAFAFA] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[#71717A] truncate">{user.email}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <div className="hidden lg:block border-t border-[#262626] p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#C9A96E]/5"
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-[#262626] z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileClose}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-[#0a0a0a] border-r border-[#262626]"
        >
          <div className="absolute right-4 top-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="text-[#71717A] hover:text-[#FAFAFA]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
