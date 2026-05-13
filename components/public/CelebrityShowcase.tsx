"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Star, X, ChevronLeft, ChevronRight } from "lucide-react";

import { getPublicCelebrities } from "@/lib/actions/public/celebrities";
import { formatCurrency } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  shortBio?: string;
  category: string;
  profileImage?: { url: string };
  nationality?: string;
  knownFor?: string;
  availableServices: { type: string; isActive: boolean; basePrice: number }[];
  featured: boolean;
  tags?: string[];
}

interface CelebrityShowcaseProps {
  initialData: {
    data: PublicCelebrity[];
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
    featured: boolean;
  };
}


export default function CelebrityShowcase({
  initialData,
  categories,
  initialFilters,
}: CelebrityShowcaseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [celebrities, setCelebrities] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isLoading, setIsLoading] = useState(false);

  const [query, setQuery] = useState(initialFilters.query);
  const [category, setCategory] = useState(initialFilters.category);
  const [featuredOnly, setFeaturedOnly] = useState(initialFilters.featured);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchCelebrities = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPublicCelebrities({
        query: debouncedQuery || undefined,
        category: category || undefined,
        page,
        featured: featuredOnly || undefined,
      });

      if (result.success && result.data) {
        setCelebrities(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, category, page, featuredOnly]);

  useEffect(() => {
    if (
      debouncedQuery !== initialFilters.query ||
      category !== initialFilters.category ||
      page !== initialFilters.page ||
      featuredOnly !== initialFilters.featured
    ) {
      fetchCelebrities();
    }
  }, [debouncedQuery, category, page, featuredOnly, fetchCelebrities, initialFilters]);

  const updateURL = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`/celebrities?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? "" : value;
    setCategory(newCategory);
    setPage(1);
    updateURL({ category: newCategory || undefined, page: undefined });
  };

  const handleFeaturedToggle = (checked: boolean) => {
    setFeaturedOnly(checked);
    setPage(1);
    updateURL({ featured: checked ? "true" : undefined, page: undefined });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage > 1 ? String(newPage) : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setFeaturedOnly(false);
    setPage(1);
    router.push("/celebrities");
  };

  const getServiceLabel = (type: string) => {
    const service = BOOKING_TYPES.find((t) => t.value === type);
    return service?.label || type;
  };

  const getLowestPrice = (services: { basePrice: number }[]) => {
    if (!services.length) return null;
    return Math.min(...services.map((s) => s.basePrice));
  };

  const hasActiveFilters = query || category || featuredOnly;

  return (
    <div className="pt-20">
      {/* Hero Banner */}
      <section className="py-16 lg:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#FAFAFA] animate-fade-in-up">
            Our Celebrities
          </h1>
          <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent animate-fade-in-up" style={{ animationDelay: "100ms" }} />
          <p className="mt-6 text-lg text-[#A1A1AA] max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            Discover and connect with world-class talent for unforgettable
            experiences
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-[#0a0a0a] border-y border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search celebrities..."
                className="pl-10 bg-[#111111] border-[#262626]"
              />
            </div>

            {/* Category */}
            <Select value={category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full lg:w-[200px] bg-[#111111] border-[#262626]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Featured Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="featured"
                checked={featuredOnly}
                onCheckedChange={handleFeaturedToggle}
              />
              <Label htmlFor="featured" className="text-sm text-[#A1A1AA]">
                Featured Only
              </Label>
            </div>

            {/* Results count */}
            <div className="text-sm text-[#71717A] lg:ml-auto">
              {total} {total === 1 ? "celebrity" : "celebrities"} found
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#71717A]">Active filters:</span>
              {query && (
                <Badge variant="secondary" className="gap-1">
                  Search: {query}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setQuery("")}
                  />
                </Badge>
              )}
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {category}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleCategoryChange("all")}
                  />
                </Badge>
              )}
              {featuredOnly && (
                <Badge variant="secondary" className="gap-1">
                  Featured
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleFeaturedToggle(false)}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[#C9A96E] hover:text-[#D4B87A]"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Celebrity Grid */}
      <section className="py-12 lg:py-16 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-[#1a1a1a]" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-[#1a1a1a] rounded w-3/4" />
                    <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
                    <div className="h-4 bg-[#1a1a1a] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : celebrities.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-[#A1A1AA] mb-4">No celebrities found</p>
              <p className="text-[#71717A] mb-6">
                Try adjusting your filters or search terms
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {celebrities.map((celebrity, index) => (
                <div
                  key={celebrity._id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/celebrities/${celebrity.slug}`}>
                    <div className="group bg-[#111111] border border-[#262626] rounded-xl overflow-hidden hover:border-[#C9A96E]/50 hover:ring-1 hover:ring-[#C9A96E]/30 transition-all duration-300">
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {celebrity.profileImage?.url ? (
                          <Image
                            src={celebrity.profileImage.url}
                            alt={celebrity.name}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                            <span className="text-4xl text-[#C9A96E]">
                              {celebrity.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Category badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-[#C9A96E]/90 text-black text-xs">
                            {celebrity.category}
                          </Badge>
                        </div>

                        {/* Featured star */}
                        {celebrity.featured && (
                          <div className="absolute top-3 left-3">
                            <div className="w-8 h-8 rounded-full bg-[#C9A96E] flex items-center justify-center">
                              <Star className="w-4 h-4 text-black fill-black" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] group-hover:text-[#C9A96E] transition-colors">
                          {celebrity.name}
                        </h3>

                        {celebrity.nationality && (
                          <p className="text-sm text-[#A1A1AA]">
                            {celebrity.nationality}
                          </p>
                        )}

                        {celebrity.shortBio && (
                          <p className="text-sm text-[#71717A] line-clamp-2">
                            {celebrity.shortBio}
                          </p>
                        )}

                        {/* Service badges */}
                        {celebrity.availableServices.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {celebrity.availableServices.slice(0, 3).map((service) => (
                              <Badge
                                key={service.type}
                                variant="outline"
                                className="text-xs border-[#262626] text-[#A1A1AA]"
                              >
                                {getServiceLabel(service.type)}
                              </Badge>
                            ))}
                            {celebrity.availableServices.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-[#262626] text-[#71717A]"
                              >
                                +{celebrity.availableServices.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        {celebrity.availableServices.length > 0 && (
                          <p className="text-sm font-medium text-[#C9A96E] pt-1">
                            From{" "}
                            {formatCurrency(
                              getLowestPrice(celebrity.availableServices) || 0
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="border-[#262626]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-[#A1A1AA]">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="border-[#262626]"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA for unauthenticated users */}
      <section className="py-16 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
            Want to Book a Celebrity?
          </h2>
          <p className="mt-4 text-[#A1A1AA]">
            Sign up today to access exclusive booking features and connect with
            your favorite celebrities
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-8"
            >
              <Link href="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[#262626]">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
