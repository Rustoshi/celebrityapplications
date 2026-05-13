import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import {
  getDashboardStats,
  getRecentBookings,
  getRecentClients,
} from "@/lib/actions/admin/dashboard";
import StatsCard from "@/components/admin/StatsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Dashboard"),
};

export default async function AdminDashboardPage() {
  const [statsResult, bookingsResult, clientsResult] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(5),
    getRecentClients(5),
  ]);

  const stats = statsResult.data || {
    totalCelebrities: 0,
    activeCelebrities: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    unreadMessages: 0,
  };

  const recentBookings = bookingsResult.data || [];
  const recentClients = clientsResult.data || [];

  const getBookingTypeLabel = (type: string) => {
    const bookingType = BOOKING_TYPES.find((t) => t.value === type);
    return bookingType?.label || type;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
          Dashboard
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
        <p className="text-sm text-[#71717A] mt-2">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Celebrities"
          value={stats.totalCelebrities}
          icon="stars"
          description={`${stats.activeCelebrities} active`}
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon="calendar"
          description={`${stats.pendingBookings} pending`}
        />
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
          icon="users"
          description={`${stats.activeClients} active`}
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon="dollar"
          description="From completed bookings"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-[#262626]">
            <h2 className="font-semibold text-[#FAFAFA]">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-1 text-sm text-[#C9A96E] hover:text-[#D4B87A] transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentBookings.length === 0 ? (
              <p className="text-center text-[#71717A] py-8">
                No bookings yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-start justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-[#FAFAFA] truncate">
                          {booking.celebrity?.name || "Unknown Celebrity"}
                        </p>
                        <StatusBadge status={booking.status} type="booking" />
                      </div>
                      <p className="text-sm text-[#A1A1AA]">
                        {getBookingTypeLabel(booking.type)}
                      </p>
                      <p className="text-xs text-[#71717A] mt-1">
                        {booking.user
                          ? `${booking.user.firstName} ${booking.user.lastName}`
                          : "Unknown Client"}{" "}
                        • {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-[#C9A96E]">
                        {formatCurrency(booking.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="bg-[#111111] border border-[#262626] rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-[#262626]">
            <h2 className="font-semibold text-[#FAFAFA]">Recent Clients</h2>
            <Link
              href="/admin/clients"
              className="flex items-center gap-1 text-sm text-[#C9A96E] hover:text-[#D4B87A] transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentClients.length === 0 ? (
              <p className="text-center text-[#71717A] py-8">
                No clients yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div
                    key={client._id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]"
                  >
                    <Avatar className="w-10 h-10 border border-[#262626]">
                      <AvatarImage
                        src={client.avatar?.url}
                        alt={`${client.firstName} ${client.lastName}`}
                      />
                      <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E] text-sm">
                        {getInitials(`${client.firstName} ${client.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#FAFAFA] truncate">
                          {client.firstName} {client.lastName}
                        </p>
                        <StatusBadge status={client.status} type="user" />
                      </div>
                      <p className="text-sm text-[#A1A1AA] truncate">
                        {client.email}
                      </p>
                      <p className="text-xs text-[#71717A]">
                        Member since {formatDate(client.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
