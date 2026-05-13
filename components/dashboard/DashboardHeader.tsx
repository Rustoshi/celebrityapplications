"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

import { getInitials } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMobileMenuOpen: () => void;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: { url: string };
  };
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/celebrities": "Browse Celebrities",
  "/dashboard/bookings": "My Bookings",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname.startsWith("/dashboard/celebrities/")) {
    return "Celebrity Profile";
  }

  if (pathname.startsWith("/dashboard/bookings/")) {
    return "Booking Details";
  }

  return "Dashboard";
}

export default function DashboardHeader({ onMobileMenuOpen, user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-[#262626]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuOpen}
            className="lg:hidden text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Page title */}
          <h1 className="font-display text-lg font-semibold text-[#FAFAFA]">
            {pageTitle}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-[#C9A96E]/30"
              >
                <Avatar className="h-10 w-10 border border-[#262626]">
                  <AvatarImage src={user.avatar?.url} alt={user.firstName} />
                  <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E]">
                    {getInitials(`${user.firstName} ${user.lastName}`)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#111111] border-[#262626]"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-[#FAFAFA]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-[#71717A]">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
