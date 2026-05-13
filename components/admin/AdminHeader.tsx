"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Bell, LogOut, Settings, User } from "lucide-react";

import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  onMobileMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/celebrities": "Celebrities",
  "/admin/bookings": "Bookings",
  "/admin/clients": "Clients",
  "/admin/payment-methods": "Payment Methods",
  "/admin/messages": "Messages",
  "/admin/settings": "Settings",
};

export default function AdminHeader({
  admin,
  onMobileMenuToggle,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path)) {
        return title;
      }
    }
    return "Admin";
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#262626]">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1a1a1a]"
            onClick={onMobileMenuToggle}
          >
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Page Title */}
          <h1 className="text-lg font-semibold text-[#FAFAFA]">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1a1a1a]"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A96E] rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Admin Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                <Avatar className="w-8 h-8 border border-[#262626]">
                  <AvatarImage src={admin.avatar} alt={`${admin.firstName} ${admin.lastName}`} />
                  <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E] text-xs font-medium">
                    {getInitials(`${admin.firstName} ${admin.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-[#FAFAFA]">
                    {admin.firstName} {admin.lastName}
                  </span>
                  <span className="text-xs text-[#71717A] capitalize">
                    {admin.role.replace("_", " ")}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#111111] border-[#262626]"
            >
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[#FAFAFA]">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="text-xs text-[#71717A]">{admin.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem asChild>
                <a
                  href="/admin/settings"
                  className="flex items-center gap-2 cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA] focus:text-[#FAFAFA]"
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="/admin/settings"
                  className="flex items-center gap-2 cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA] focus:text-[#FAFAFA]"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#262626]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
