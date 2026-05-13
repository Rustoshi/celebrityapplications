"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarCheck, Stars, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/utils";
import { BOOKING_TYPES, BOOKING_STATUSES } from "@/lib/constants";
import { getMyBookings, cancelBooking } from "@/lib/actions/client/bookings";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/admin/StatusBadge";

interface SerializedClientBooking {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  submittedAt: string;
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: { url: string };
    category: string;
  } | null;
}

interface MyBookingsClientProps {
  initialData: {
    data: SerializedClientBooking[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  initialFilters: {
    status: string;
    page: number;
  };
}

export default function MyBookingsClient({
  initialData,
  initialFilters,
}: MyBookingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getMyBookings({
        status: newFilters.status || undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        const mappedData = {
          data: result.data.data.map((b) => ({
            _id: b._id,
            bookingId: b.bookingId,
            type: b.type,
            status: b.status,
            amount: b.amount,
            currency: b.currency,
            createdAt: b.createdAt,
            submittedAt: b.submittedAt,
            celebrity: b.celebrity
              ? {
                  _id: b.celebrity._id,
                  name: b.celebrity.name,
                  slug: b.celebrity.slug,
                  profileImage: b.celebrity.profileImage,
                  category: b.celebrity.category,
                }
              : null,
          })),
          total: result.data.total,
          page: result.data.page,
          totalPages: result.data.totalPages,
          hasMore: result.data.hasMore,
        };
        setData(mappedData);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (newFilters.status && newFilters.status !== "all") {
        params.set("status", newFilters.status);
      }
      if (newFilters.page > 1) params.set("page", String(newFilters.page));

      const queryString = params.toString();
      router.push(`/dashboard/bookings${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters, status: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchBookings(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchBookings(newFilters);
  };

  const openCancelDialog = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      const result = await cancelBooking(bookingToCancel, cancelReason || undefined);

      if (result.success) {
        toast.success("Booking cancelled successfully");
        setCancelDialogOpen(false);
        fetchBookings(filters);
      } else {
        toast.error(result.error || "Failed to cancel booking");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCancelling(false);
    }
  };

  const getBookingTypeLabel = (type: string) => {
    const bookingType = BOOKING_TYPES.find((t) => t.value === type);
    return bookingType?.label || type;
  };

  const getBookingTypeIcon = (type: string) => {
    const bookingType = BOOKING_TYPES.find((t) => t.value === type);
    return bookingType?.icon;
  };

  const canCancel = (status: string) => {
    return ["pending", "under_review", "approved", "payment_pending"].includes(status);
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
            My Bookings
          </h1>
          <p className="text-[#A1A1AA] mt-1">
            {data.total} total booking{data.total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-[#111111] border-[#262626]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Statuses</SelectItem>
            {BOOKING_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#111111] border border-[#262626] rounded-xl p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-full bg-[#1a1a1a]" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 bg-[#1a1a1a] mb-2" />
                  <Skeleton className="h-4 w-24 bg-[#1a1a1a]" />
                </div>
              </div>
              <Skeleton className="h-4 w-full bg-[#1a1a1a] mb-2" />
              <Skeleton className="h-4 w-2/3 bg-[#1a1a1a]" />
            </div>
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-12 text-center">
          <CalendarCheck className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
          <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">
            No bookings yet
          </h3>
          <p className="text-[#71717A] mb-6">
            Browse our celebrities to make your first booking!
          </p>
          <Button asChild className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
            <Link href="/dashboard/celebrities">Browse Celebrities</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.data.map((booking) => {
            const Icon = getBookingTypeIcon(booking.type);

            return (
              <div
                key={booking._id}
                className="bg-[#111111] border border-[#262626] rounded-xl p-5 hover:border-[#C9A96E]/30 transition-colors"
              >
                {/* Celebrity Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#1a1a1a] shrink-0">
                    {booking.celebrity?.profileImage?.url ? (
                      <Image
                        src={booking.celebrity.profileImage.url}
                        alt={booking.celebrity.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stars className="w-5 h-5 text-[#71717A]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#FAFAFA] truncate">
                      {booking.celebrity?.name || "Unknown Celebrity"}
                    </p>
                    <p className="text-sm text-[#71717A]">
                      {booking.celebrity?.category}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} type="booking" />
                </div>

                {/* Booking Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-[#C9A96E]" />}
                    <span className="text-sm text-[#FAFAFA]">
                      {getBookingTypeLabel(booking.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#71717A]">
                      ID: {booking.bookingId}
                    </span>
                    <span className="text-lg font-semibold text-[#C9A96E]">
                      {formatCurrency(booking.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#71717A]">
                    Submitted {format(new Date(booking.submittedAt), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#262626] hover:bg-[#1a1a1a]"
                  >
                    <Link href={`/dashboard/bookings/${booking._id}`}>
                      View Details
                    </Link>
                  </Button>
                  {canCancel(booking.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelDialog(booking._id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-[#71717A]">
            Showing {startIndex}-{endIndex} of {data.total} bookings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page <= 1 || isLoading}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={!data.hasMore || isLoading}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Cancel Booking</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to cancel this booking? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm text-[#A1A1AA]">
              Reason for cancellation (optional)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let us know why you're cancelling..."
              rows={3}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="border-[#262626]"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
