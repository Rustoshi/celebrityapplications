"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Stars,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatCurrency, getInitials, truncateText } from "@/lib/utils";
import { CELEBRITY_CATEGORIES } from "@/lib/constants";
import {
  getCelebrities,
  toggleCelebrityStatus,
  toggleCelebrityFeatured,
  deleteCelebrity,
} from "@/lib/actions/admin/celebrities";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface SerializedCelebrity {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: { url: string; publicId: string };
  nationality?: string;
  featured: boolean;
  isActive: boolean;
  totalBookings: number;
  totalRevenue: number;
  servicesCount: number;
  createdAt: string;
}

interface CelebritiesClientProps {
  initialData: {
    data: SerializedCelebrity[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  initialFilters: {
    query: string;
    category: string;
    status: string;
    page: number;
  };
}

export default function CelebritiesClient({
  initialData,
  initialFilters,
}: CelebritiesClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [celebrityToDelete, setCelebrityToDelete] = useState<SerializedCelebrity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCelebrities = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getCelebrities({
        query: newFilters.query || undefined,
        category: newFilters.category || undefined,
        status: newFilters.status || undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error(result.error || "Failed to fetch celebrities");
      }
    } catch {
      toast.error("Failed to fetch celebrities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.query) {
        const newFilters = { ...filters, query: searchInput, page: 1 };
        setFilters(newFilters);
        fetchCelebrities(newFilters);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, filters, fetchCelebrities]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchCelebrities(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchCelebrities(newFilters);
  };

  const handleToggleStatus = async (celebrity: SerializedCelebrity) => {
    const previousData = { ...data };
    setData((prev) => ({
      ...prev,
      data: prev.data.map((c) =>
        c._id === celebrity._id ? { ...c, isActive: !c.isActive } : c
      ),
    }));

    const result = await toggleCelebrityStatus(celebrity._id);

    if (result.success) {
      toast.success(
        result.data?.isActive
          ? `${celebrity.name} is now active`
          : `${celebrity.name} is now inactive`
      );
    } else {
      setData(previousData);
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleToggleFeatured = async (celebrity: SerializedCelebrity) => {
    const previousData = { ...data };
    setData((prev) => ({
      ...prev,
      data: prev.data.map((c) =>
        c._id === celebrity._id ? { ...c, featured: !c.featured } : c
      ),
    }));

    const result = await toggleCelebrityFeatured(celebrity._id);

    if (result.success) {
      toast.success(
        result.data?.featured
          ? `${celebrity.name} is now featured`
          : `${celebrity.name} is no longer featured`
      );
    } else {
      setData(previousData);
      toast.error(result.error || "Failed to update featured status");
    }
  };

  const handleDeleteClick = (celebrity: SerializedCelebrity) => {
    setCelebrityToDelete(celebrity);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!celebrityToDelete) return;

    setIsDeleting(true);
    const result = await deleteCelebrity(celebrityToDelete._id);

    if (result.success) {
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((c) => c._id !== celebrityToDelete._id),
        total: prev.total - 1,
      }));
      toast.success(`${celebrityToDelete.name} has been deleted`);
      setDeleteDialogOpen(false);
      setCelebrityToDelete(null);
    } else {
      toast.error(result.error || "Failed to delete celebrity");
    }

    setIsDeleting(false);
  };

  const getCategoryLabel = (value: string) => {
    return value;
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
            Celebrities
          </h1>
          <Badge variant="secondary" className="bg-[#1a1a1a] text-[#A1A1AA]">
            {data.total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#262626] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-[#1a1a1a] text-[#C9A96E]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-[#1a1a1a] text-[#C9A96E]"
                  : "text-[#71717A] hover:text-[#FAFAFA]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button asChild className="bg-[#C9A96E] text-black hover:bg-[#D4B87A]">
            <Link href="/admin/celebrities/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Celebrity
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <Input
            placeholder="Search celebrities..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0a0a] border-[#262626]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Categories</SelectItem>
            {CELEBRITY_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px] bg-[#0a0a0a] border-[#262626]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#262626] rounded-lg p-4">
              <Skeleton className="aspect-square rounded-lg mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data.data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
            <Stars className="w-8 h-8 text-[#71717A]" />
          </div>
          <h3 className="text-lg font-semibold text-[#FAFAFA] mb-2">
            No celebrities found
          </h3>
          <p className="text-[#71717A] mb-6 max-w-sm">
            {filters.query || filters.category !== "all" || filters.status !== "all"
              ? "Try adjusting your filters or search term"
              : "Get started by adding your first celebrity"}
          </p>
          {!filters.query && filters.category === "all" && filters.status === "all" && (
            <Button asChild className="bg-[#C9A96E] text-black hover:bg-[#D4B87A]">
              <Link href="/admin/celebrities/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Celebrity
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && data.data.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.data.map((celebrity) => (
            <div
              key={celebrity._id}
              className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden hover:border-[#404040] transition-colors"
            >
              <div className="aspect-square relative bg-[#0a0a0a]">
                {celebrity.profileImage?.url ? (
                  <Image
                    src={celebrity.profileImage.url}
                    alt={celebrity.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#C9A96E]">
                    {getInitials(celebrity.name)}
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {celebrity.featured && (
                    <div className="w-6 h-6 rounded-full bg-[#C9A96E] flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-black fill-current" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      celebrity.isActive ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#FAFAFA] truncate">
                      {celebrity.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs border-[#262626] text-[#A1A1AA]"
                      >
                        {getCategoryLabel(celebrity.category)}
                      </Badge>
                      {celebrity.nationality && (
                        <span className="text-xs text-[#71717A]">
                          {celebrity.nationality}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#111111] border-[#262626]"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/admin/celebrities/${celebrity._id}/edit`}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#262626]" />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(celebrity)}
                        className="flex items-center gap-2"
                      >
                        {celebrity.isActive ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleFeatured(celebrity)}
                        className="flex items-center gap-2"
                      >
                        {celebrity.featured ? (
                          <>
                            <StarOff className="w-4 h-4" />
                            Unfeature
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4" />
                            Feature
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#262626]" />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(celebrity)}
                        className="flex items-center gap-2 text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {celebrity.shortBio && (
                  <p className="text-sm text-[#71717A] mb-3 line-clamp-2">
                    {truncateText(celebrity.shortBio, 80)}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <span>{celebrity.totalBookings} bookings</span>
                  <span>{formatCurrency(celebrity.totalRevenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && data.data.length > 0 && viewMode === "list" && (
        <div className="bg-[#111111] border border-[#262626] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#262626] hover:bg-transparent">
                <TableHead className="text-[#A1A1AA]">Celebrity</TableHead>
                <TableHead className="text-[#A1A1AA]">Category</TableHead>
                <TableHead className="text-[#A1A1AA]">Status</TableHead>
                <TableHead className="text-[#A1A1AA] text-right">Bookings</TableHead>
                <TableHead className="text-[#A1A1AA] text-right">Revenue</TableHead>
                <TableHead className="text-[#A1A1AA] text-center">Featured</TableHead>
                <TableHead className="text-[#A1A1AA] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((celebrity) => (
                <TableRow
                  key={celebrity._id}
                  className="border-[#262626] hover:bg-[#0a0a0a]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0a0a] flex-shrink-0">
                        {celebrity.profileImage?.url ? (
                          <Image
                            src={celebrity.profileImage.url}
                            alt={celebrity.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[#C9A96E]">
                            {getInitials(celebrity.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#FAFAFA]">{celebrity.name}</p>
                        {celebrity.nationality && (
                          <p className="text-xs text-[#71717A]">{celebrity.nationality}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs border-[#262626] text-[#A1A1AA]"
                    >
                      {getCategoryLabel(celebrity.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        celebrity.isActive
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {celebrity.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[#FAFAFA]">
                    {celebrity.totalBookings}
                  </TableCell>
                  <TableCell className="text-right text-[#C9A96E]">
                    {formatCurrency(celebrity.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    {celebrity.featured ? (
                      <Star className="w-4 h-4 text-[#C9A96E] fill-current mx-auto" />
                    ) : (
                      <span className="text-[#71717A]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#111111] border-[#262626]"
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/celebrities/${celebrity._id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#262626]" />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(celebrity)}
                          className="flex items-center gap-2"
                        >
                          {celebrity.isActive ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(celebrity)}
                          className="flex items-center gap-2"
                        >
                          {celebrity.featured ? (
                            <>
                              <StarOff className="w-4 h-4" />
                              Unfeature
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" />
                              Feature
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#262626]" />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(celebrity)}
                          className="flex items-center gap-2 text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#71717A]">
            Showing {startIndex}-{endIndex} of {data.total} celebrities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[#A1A1AA]">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={!data.hasMore}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Celebrity</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#FAFAFA]">
                {celebrityToDelete?.name}
              </span>
              ? This action cannot be undone.
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
              className="bg-red-500 hover:bg-red-600 text-white"
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
