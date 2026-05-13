import { Metadata } from "next";

import {
  getPublicCelebrities,
  getPublicCategories,
} from "@/lib/actions/public/celebrities";
import CelebrityShowcase from "@/components/public/CelebrityShowcase";
import { pageTitle } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle("Celebrities"),
  description:
    "Browse our curated roster of world-class celebrities. From actors and musicians to athletes and influencers, find the perfect talent for your next event.",
};

interface CelebritiesPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    page?: string;
    featured?: string;
  }>;
}

export default async function CelebritiesPage({
  searchParams,
}: CelebritiesPageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const category = params.category || "";
  const page = parseInt(params.page || "1", 10);
  const featured = params.featured === "true";

  const [celebritiesResult, categoriesResult] = await Promise.all([
    getPublicCelebrities({
      query: query || undefined,
      category: category || undefined,
      page,
      featured: featured || undefined,
    }),
    getPublicCategories(),
  ]);

  const initialData = celebritiesResult.data || {
    data: [],
    total: 0,
    page: 1,
    totalPages: 0,
    hasMore: false,
  };

  const categories = categoriesResult.data || [];

  return (
    <CelebrityShowcase
      initialData={initialData}
      categories={categories}
      initialFilters={{ query, category, page, featured }}
    />
  );
}
