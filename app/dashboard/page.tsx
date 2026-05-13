import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, DollarSign, Clock, ArrowRight, Stars } from "lucide-react";
import { format } from "date-fns";

import { getCurrentUser } from "@/lib/auth-utils";
import { connectDB } from "@/lib/db";
import { BookingRequest, Celebrity } from "@/lib/models";
import { getFeaturedCelebrities } from "@/lib/actions/client/celebrities";
import { formatCurrency, truncateText } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import { pageTitle } from "@/lib/site-config";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata = {
  title: pageTitle("Dashboard"),
};

interface SerializedBooking {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: { url: string };
    category: string;
  } | null;
}

async function getRecentBookings(userId: string): Promise<SerializedBooking[]> {
  await connectDB();

  const bookings = await BookingRequest.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("celebrityId", "name slug profileImage category")
    .lean();

  return bookings.map((booking) => {
    const celebrity = booking.celebrityId as unknown as {
      _id: unknown;
      name: string;
      slug: string;
      profileImage?: { url: string };
      category: string;
    } | null;

    return {
      _id: String(booking._id),
      bookingId: booking.bookingId as string,
      type: booking.type as string,
      status: booking.status as string,
      amount: (booking.amount as number) || 0,
      currency: (booking.currency as string) || "USD",
      createdAt: new Date(booking.createdAt as Date).toISOString(),
      celebrity: celebrity
        ? {
            _id: String(celebrity._id),
            name: celebrity.name,
            slug: celebrity.slug,
            profileImage: celebrity.profileImage,
            category: celebrity.category,
          }
        : null,
    };
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [featuredResult, recentBookings] = await Promise.all([
    getFeaturedCelebrities(6),
    getRecentBookings(String(user._id)),
  ]);

  const featuredCelebrities =
    featuredResult.success && featuredResult.data ? featuredResult.data : [];

  const activeBookings = recentBookings.filter(
    (b) => !["completed", "cancelled", "rejected"].includes(b.status)
  ).length;

  const getBookingTypeLabel = (type: string) => {
    const bookingType = BOOKING_TYPES.find((t) => t.value === type);
    return bookingType?.label || type;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#C9A96E]/10">
              <CalendarCheck className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#FAFAFA]">
                {user.totalBookings}
              </p>
              <p className="text-sm text-[#71717A]">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#C9A96E]/10">
              <DollarSign className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#FAFAFA]">
                {formatCurrency(user.totalSpent)}
              </p>
              <p className="text-sm text-[#71717A]">Total Spent</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#C9A96E]/10">
              <Clock className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#FAFAFA]">
                {activeBookings}
              </p>
              <p className="text-sm text-[#71717A]">Active Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Celebrities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-[#FAFAFA]">
            Featured Celebrities
          </h2>
          <Link
            href="/dashboard/celebrities"
            className="flex items-center gap-1 text-sm text-[#C9A96E] hover:text-[#D4B87A] transition-colors"
          >
            Browse All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredCelebrities.length === 0 ? (
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-8 text-center">
            <Stars className="w-10 h-10 mx-auto text-[#71717A] mb-3" />
            <p className="text-[#71717A]">No featured celebrities available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCelebrities.map((celebrity) => (
              <Link
                key={celebrity._id}
                href={`/dashboard/celebrities/${celebrity.slug}`}
                className="group"
              >
                <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden hover:border-[#C9A96E]/30 transition-colors">
                  <div className="relative aspect-square">
                    {celebrity.profileImage?.url ? (
                      <Image
                        src={celebrity.profileImage.url}
                        alt={celebrity.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                        <Stars className="w-8 h-8 text-[#262626]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-[#FAFAFA] truncate text-sm">
                      {celebrity.name}
                    </p>
                    <p className="text-xs text-[#71717A] truncate">
                      {celebrity.category}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-[#FAFAFA]">
            Recent Bookings
          </h2>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1 text-sm text-[#C9A96E] hover:text-[#D4B87A] transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-8 text-center">
            <CalendarCheck className="w-10 h-10 mx-auto text-[#71717A] mb-3" />
            <p className="text-[#FAFAFA] mb-2">No bookings yet</p>
            <p className="text-sm text-[#71717A] mb-4">
              Browse our celebrities to get started!
            </p>
            <Button asChild className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
              <Link href="/dashboard/celebrities">Browse Celebrities</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#262626]">
                    <th className="text-left text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Celebrity
                    </th>
                    <th className="text-left text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-medium text-[#71717A] uppercase tracking-wider px-4 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {recentBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-[#0a0a0a]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1a]">
                            {booking.celebrity?.profileImage?.url ? (
                              <Image
                                src={booking.celebrity.profileImage.url}
                                alt={booking.celebrity.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#71717A]">
                                <Stars className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#FAFAFA] text-sm">
                              {booking.celebrity?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-[#71717A]">
                              {booking.celebrity?.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#A1A1AA]">
                          {getBookingTypeLabel(booking.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} type="booking" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#C9A96E]">
                          {formatCurrency(booking.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#71717A]">
                          {format(new Date(booking.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/bookings/${booking._id}`}
                          className="text-sm text-[#C9A96E] hover:text-[#D4B87A]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
