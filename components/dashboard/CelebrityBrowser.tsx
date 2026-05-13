"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Star, X, Stars } from "lucide-react";

import { cn, formatCurrency, truncateText } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import { browseCelebrities } from "@/lib/actions/client/celebrities";

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
import { Skeleton } from "@/components/ui/skeleton";

interface AvailableService {
  type: string;
  isActive: boolean;
  basePrice: number;
}

interface SerializedPublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: { url: string };
  nationality?: string;
  knownFor?: string;
  availableServices: AvailableService[];
  featured: boolean;
  tags?: string[];
}

interface CelebrityBrowserProps {
  initialData: {
    data: SerializedPublicCelebrity[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
  categories: { category: string; count: number }[];
  initialFilters: {
    query: string;
    category: string;
    page: number;
  };
}

export default function CelebrityBrowser({
  initialData,
  categories,
  initialFilters,
}: CelebrityBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCelebrities = useCallback(async (newFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await browseCelebrities({
        query: newFilters.query || undefined,
        category: newFilters.category || undefined,
        page: newFilters.page,
      });

      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching celebrities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.category) params.set("category", newFilters.category);
      if (newFilters.page > 1) params.set("page", String(newFilters.page));

      const queryString = params.toString();
      router.push(`/dashboard/celebrities${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.query) {
        const newFilters = { ...filters, query: searchInput, page: 1 };
        setFilters(newFilters);
        updateURL(newFilters);
        fetchCelebrities(newFilters);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, filters, updateURL, fetchCelebrities]);

  useEffect(() => {
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    const newFilters = { query, category, page };
    if (
      newFilters.query !== filters.query ||
      newFilters.category !== filters.category ||
      newFilters.page !== filters.page
    ) {
      setFilters(newFilters);
      setSearchInput(query);
      fetchCelebrities(newFilters);
    }
  }, [searchParams]);

  const handleCategoryChange = (value: string) => {
    const newFilters = {
      ...filters,
      category: value === "all" ? "" : value,
      page: 1,
    };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchCelebrities(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchCelebrities(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { query: "", category: "", page: 1 };
    setFilters(newFilters);
    setSearchInput("");
    updateURL(newFilters);
    fetchCelebrities(newFilters);
  };

  const hasActiveFilters = filters.query || filters.category;

  const getServiceLabel = (type: string) => {
    const service = BOOKING_TYPES.find((t) => t.value === type);
    return service?.label || type;
  };

  const getLowestPrice = (services: AvailableService[]) => {
    const activeServices = services.filter((s) => s.isActive && s.basePrice > 0);
    if (activeServices.length === 0) return null;
    return Math.min(...activeServices.map((s) => s.basePrice));
  };

  const startIndex = (data.page - 1) * 12 + 1;
  const endIndex = Math.min(data.page * 12, data.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
          Browse Celebrities
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          Discover and book your favorite celebrities
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <Input
            placeholder="Search celebrities..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-[#111111] border-[#262626] focus:border-[#C9A96E]"
          />
        </div>
        <Select
          value={filters.category || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-[#111111] border-[#262626]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#111111] border-[#262626]">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#71717A]">Active filters:</span>
          {filters.query && (
            <Badge
              variant="outline"
              className="border-[#C9A96E]/30 text-[#C9A96E] gap-1"
            >
              Search: {filters.query}
              <button
                onClick={() => {
                  setSearchInput("");
                  const newFilters = { ...filters, query: "", page: 1 };
                  setFilters(newFilters);
                  updateURL(newFilters);
                  fetchCelebrities(newFilters);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge
              variant="outline"
              className="border-[#C9A96E]/30 text-[#C9A96E] gap-1"
            >
              {filters.category}
              <button onClick={() => handleCategoryChange("all")}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-[#71717A] hover:text-[#FAFAFA] h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Celebrity Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-lg bg-[#1a1a1a]" />
              <Skeleton className="h-5 w-2/3 bg-[#1a1a1a]" />
              <Skeleton className="h-4 w-1/2 bg-[#1a1a1a]" />
            </div>
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <div className="text-center py-16">
          <Stars className="w-12 h-12 mx-auto text-[#71717A] mb-4" />
          <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">
            No celebrities found
          </h3>
          <p className="text-[#71717A] mb-4">
            No celebrities match your current criteria
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.data.map((celebrity) => (
            <CelebrityCard
              key={celebrity._id}
              celebrity={celebrity}
              getServiceLabel={getServiceLabel}
              getLowestPrice={getLowestPrice}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-[#71717A]">
            Showing {startIndex}-{endIndex} of {data.total} celebrities
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
    </div>
  );
}

function CelebrityCard({
  celebrity,
  getServiceLabel,
  getLowestPrice,
}: {
  celebrity: SerializedPublicCelebrity;
  getServiceLabel: (type: string) => string;
  getLowestPrice: (services: AvailableService[]) => number | null;
}) {
  const lowestPrice = getLowestPrice(celebrity.availableServices);
  const activeServices = celebrity.availableServices.filter((s) => s.isActive);

  return (
    <Link
      href={`/dashboard/celebrities/${celebrity.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg bg-[#111111] border border-[#262626] transition-all duration-300 hover:border-[#C9A96E]/50 hover:shadow-[0_0_20px_rgba(201,169,110,0.1)]">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {celebrity.profileImage?.url ? (
            <Image
              src={celebrity.profileImage.url}
              alt={celebrity.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
              <Stars className="w-16 h-16 text-[#262626]" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Featured badge */}
          {celebrity.featured && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#C9A96E]/90 text-black text-xs font-medium">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </div>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-[#111111]/80 text-[#FAFAFA] border-0 text-xs">
              {celebrity.category}
            </Badge>
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-xl font-semibold text-[#FAFAFA] mb-1">
              {celebrity.name}
            </h3>
            {celebrity.nationality && (
              <p className="text-sm text-[#A1A1AA] mb-2">{celebrity.nationality}</p>
            )}
            {celebrity.shortBio && (
              <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3">
                {truncateText(celebrity.shortBio, 80)}
              </p>
            )}

            {/* Services */}
            {activeServices.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {activeServices.slice(0, 3).map((service) => (
                  <Badge
                    key={service.type}
                    variant="outline"
                    className="border-[#C9A96E]/30 text-[#C9A96E] text-xs"
                  >
                    {getServiceLabel(service.type)}
                  </Badge>
                ))}
                {activeServices.length > 3 && (
                  <Badge
                    variant="outline"
                    className="border-[#262626] text-[#71717A] text-xs"
                  >
                    +{activeServices.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Price */}
            {lowestPrice && (
              <p className="text-sm">
                <span className="text-[#71717A]">From </span>
                <span className="text-[#C9A96E] font-semibold">
                  {formatCurrency(lowestPrice)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
