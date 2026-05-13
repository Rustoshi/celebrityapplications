"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Search, MoreHorizontal, Eye, UserX, UserCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDate } from "@/lib/utils";
import { getClients, toggleClientStatus, deleteClient } from "@/lib/actions/admin/clients";

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
  DropdownMenuSeparator,
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

interface SerializedClientListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  avatar?: string;
  phone?: string;
  country?: string;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
}

interface ClientsClientProps {
  initialData: {
    data: SerializedClientListItem[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  initialFilters: {
    query: string;
    status: string;
    page: number;
  };
}

export default function ClientsClient({ initialData, initialFilters }: ClientsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<SerializedClientListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getClients({
        query: newFilters.query || undefined,
        status: newFilters.status !== "all" ? newFilters.status : undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.status !== "all") params.set("status", newFilters.status);
      if (newFilters.page > 1) params.set("page", String(newFilters.page));

      const queryString = params.toString();
      router.push(`/admin/clients${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.query) {
        const newFilters = { ...filters, query: searchInput, page: 1 };
        setFilters(newFilters);
        updateURL(newFilters);
        fetchClients(newFilters);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, filters, updateURL, fetchClients]);

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const newFilters = { query, status, page };
    if (
      newFilters.query !== filters.query ||
      newFilters.status !== filters.status ||
      newFilters.page !== filters.page
    ) {
      setFilters(newFilters);
      setSearchInput(query);
      fetchClients(newFilters);
    }
  }, [searchParams]);

  const handleFilterChange = (key: "status", value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchClients(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchClients(newFilters);
  };

  const handleToggleStatus = async (client: SerializedClientListItem) => {
    const newStatus = client.status === "active" ? "suspended" : "active";

    setData((prev) => ({
      ...prev,
      data: prev.data.map((c) =>
        c._id === client._id ? { ...c, status: newStatus } : c
      ),
    }));

    const result = await toggleClientStatus(client._id, newStatus);

    if (result.success) {
      toast.success(
        newStatus === "active" ? "Client activated" : "Client suspended"
      );
    } else {
      setData((prev) => ({
        ...prev,
        data: prev.data.map((c) =>
          c._id === client._id ? { ...c, status: client.status } : c
        ),
      }));
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleDeleteClick = (client: SerializedClientListItem) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    const result = await deleteClient(clientToDelete._id);

    if (result.success) {
      toast.success("Client deleted successfully");
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((c) => c._id !== clientToDelete._id),
        total: prev.total - 1,
      }));
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete client");
    }

    setIsDeleting(false);
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Clients</h1>
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
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-[#0a0a0a] border-[#262626]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-40 bg-[#1a1a1a]" />
                <Skeleton className="h-10 w-24 bg-[#1a1a1a]" />
                <Skeleton className="h-10 flex-1 bg-[#1a1a1a]" />
              </div>
            ))}
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
            <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">No clients found</h3>
            <p className="text-sm text-[#71717A]">
              {filters.query || filters.status !== "all"
                ? "Try adjusting your filters"
                : "Clients will appear here when they register"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#262626] hover:bg-transparent">
                <TableHead className="text-[#A1A1AA]">Client</TableHead>
                <TableHead className="text-[#A1A1AA]">Status</TableHead>
                <TableHead className="text-[#A1A1AA]">Country</TableHead>
                <TableHead className="text-[#A1A1AA]">Bookings</TableHead>
                <TableHead className="text-[#A1A1AA]">Total Spent</TableHead>
                <TableHead className="text-[#A1A1AA]">Member Since</TableHead>
                <TableHead className="text-[#A1A1AA] w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((client) => (
                <TableRow
                  key={client._id}
                  className="border-[#262626] hover:bg-[#0a0a0a]/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={client.avatar} />
                        <AvatarFallback className="bg-[#1a1a1a] text-[#C9A96E]">
                          {client.firstName.charAt(0)}
                          {client.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-[#FAFAFA] truncate">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-[#71717A] truncate">{client.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} type="user" />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#A1A1AA]">
                      {client.country || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#FAFAFA]">{client.totalBookings}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-[#C9A96E]">
                      {formatCurrency(client.totalSpent)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#A1A1AA]">
                      {formatDate(client.createdAt)}
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
                            href={`/admin/clients/${client._id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#262626]" />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(client)}
                          className={
                            client.status === "active"
                              ? "text-yellow-400 focus:text-yellow-400 focus:bg-yellow-400/10"
                              : "text-green-400 focus:text-green-400 focus:bg-green-400/10"
                          }
                        >
                          {client.status === "active" ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(client)}
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
            Showing {startIndex}-{endIndex} of {data.total} clients
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
            <DialogTitle className="text-[#FAFAFA]">Delete Client</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#FAFAFA]">
                {clientToDelete?.firstName} {clientToDelete?.lastName}
              </span>
              ? This will also delete all their bookings. This action cannot be undone.
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
