"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, Search, MoreHorizontal, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_TYPES, BOOKING_STATUSES } from "@/lib/constants";
import { getBookings, deleteBooking } from "@/lib/actions/admin/bookings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/admin/StatusBadge";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface SerializedBookingListItem {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  submittedAt: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  } | null;
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: CloudinaryImage;
    category: string;
  } | null;
}

interface BookingsClientProps {
  initialData: {
    data: SerializedBookingListItem[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  initialFilters: {
    query: string;
    status: string;
    type: string;
    page: number;
  };
}

export default function BookingsClient({ initialData, initialFilters }: BookingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<SerializedBookingListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBookings = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getBookings({
        query: newFilters.query || undefined,
        status: newFilters.status !== "all" ? newFilters.status : undefined,
        type: newFilters.type !== "all" ? newFilters.type : undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.type !== "all") params.set("type", newFilters.type);
      if (newFilters.page > 1) params.set("page", String(newFilters.page));

      const queryString = params.toString();
      router.push(`/admin/bookings${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.query) {
        const newFilters = { ...filters, query: searchInput, page: 1 };
        setFilters(newFilters);
        updateURL(newFilters);
        fetchBookings(newFilters);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, filters, updateURL, fetchBookings]);

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const newFilters = { query, status, type, page };
    if (
      newFilters.query !== filters.query ||
      newFilters.status !== filters.status ||
      newFilters.type !== filters.type ||
      newFilters.page !== filters.page
    ) {
      setFilters(newFilters);
      setSearchInput(query);
      fetchBookings(newFilters);
    }
  }, [searchParams]);

  const handleFilterChange = (key: "status" | "type", value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
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

  const handleDeleteClick = (booking: SerializedBookingListItem) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookingToDelete) return;

    setIsDeleting(true);
    const result = await deleteBooking(bookingToDelete._id);

    if (result.success) {
      toast.success("Booking deleted successfully");
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((b) => b._id !== bookingToDelete._id),
        total: prev.total - 1,
      }));
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete booking");
    }

    setIsDeleting(false);
  };

  const getTypeLabel = (value: string) => {
    const type = BOOKING_TYPES.find((t) => t.value === value);
    return type?.label || value;
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Bookings</h1>
          <Badge variant="outline" className="border-[#262626] text-[#A1A1AA]">
            {data.total}
          </Badge>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <Input
            placeholder="Search by booking ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0a0a] border-[#262626]">
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
        <Select
          value={filters.type}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0a0a] border-[#262626]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Types</SelectItem>
            {BOOKING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-28 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-40 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-32 bg-[#1a1a1a]" />
                <Skeleton className="h-10 flex-1 bg-[#1a1a1a]" />
              </div>
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
            <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">No bookings found</h3>
            <p className="text-sm text-[#71717A]">
              {filters.query || filters.status !== "all" || filters.type !== "all"
                ? "Try adjusting your filters"
                : "Bookings will appear here when clients submit requests"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#262626] hover:bg-transparent">
                <TableHead className="text-[#A1A1AA]">Booking ID</TableHead>
                <TableHead className="text-[#A1A1AA]">Client</TableHead>
                <TableHead className="text-[#A1A1AA]">Celebrity</TableHead>
                <TableHead className="text-[#A1A1AA]">Type</TableHead>
                <TableHead className="text-[#A1A1AA]">Amount</TableHead>
                <TableHead className="text-[#A1A1AA]">Status</TableHead>
                <TableHead className="text-[#A1A1AA]">Date</TableHead>
                <TableHead className="text-[#A1A1AA] w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((booking) => (
                <TableRow
                  key={booking._id}
                  className="border-[#262626] hover:bg-[#0a0a0a]/50"
                >
                  <TableCell>
                    <Link
                      href={`/admin/bookings/${booking._id}`}
                      className="font-mono text-sm text-[#C9A96E] hover:underline"
                    >
                      {booking.bookingId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {booking.user ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={booking.user.avatar} />
                          <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E] text-xs">
                            {booking.user.firstName.charAt(0)}{booking.user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#FAFAFA] truncate">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.celebrity ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                          {booking.celebrity.profileImage?.url ? (
                            <Image
                              src={booking.celebrity.profileImage.url}
                              alt={booking.celebrity.name}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-xs text-[#C9A96E]">
                              {booking.celebrity.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#FAFAFA] truncate">
                            {booking.celebrity.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-[#262626] text-[#71717A]"
                          >
                            {booking.celebrity.category}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#FAFAFA]">{getTypeLabel(booking.type)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-[#C9A96E]">
                      {formatCurrency(booking.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} type="booking" />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#A1A1AA]">
                      {formatDate(booking.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#71717A] hover:text-[#FAFAFA]"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#111111] border-[#262626]"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/bookings/${booking._id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(booking)}
                          className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Booking</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete booking{" "}
              <span className="font-mono text-[#C9A96E]">{bookingToDelete?.bookingId}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
