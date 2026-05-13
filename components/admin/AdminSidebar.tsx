"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stars,
  CalendarCheck,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  IdCard,
  Crown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Celebrities", href: "/admin/celebrities", icon: Stars },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { label: "Clients", href: "/admin/clients", icon: Users },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Fan Cards", href: "/admin/fan-cards", icon: IdCard },
      { label: "Memberships", href: "/admin/memberships", icon: Crown },
      { label: "Payment Methods", href: "/admin/payment-methods", icon: CreditCard },
      { label: "Messages", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function SidebarContent({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar-background">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!isCollapsed ? (
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-gradient-gold">
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Admin
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="font-display text-xl font-bold text-gradient-gold">
              C
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-6">
          {navItems.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-medium">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-[#C9A96E]"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          isActive && "text-[#C9A96E]"
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
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
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r border-sidebar-border z-40 transition-all duration-300 hidden lg:block",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} onToggle={onToggle} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileClose}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 bg-sidebar-background border-sidebar-border"
        >
          <button
            onClick={onMobileClose}
            className="absolute right-4 top-4 text-sidebar-foreground/60 hover:text-sidebar-foreground z-50"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent isCollapsed={false} onToggle={() => {}} />
        </SheetContent>
      </Sheet>
    </>
  );
}
