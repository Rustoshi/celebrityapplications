import {
  browseCelebrities,
  getCelebrityCategories,
} from "@/lib/actions/client/celebrities";
import CelebrityBrowser from "@/components/dashboard/CelebrityBrowser";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Browse Celebrities"),
};

interface PageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function BrowseCelebritiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const category = params.category || "";
  const page = parseInt(params.page || "1", 10);

  const [celebritiesResult, categoriesResult] = await Promise.all([
    browseCelebrities({
      query: query || undefined,
      category: category || undefined,
      page,
    }),
    getCelebrityCategories(),
  ]);

  const initialData =
    celebritiesResult.success && celebritiesResult.data
      ? celebritiesResult.data
      : {
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false,
        };

  const categories =
    categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  const initialFilters = {
    query,
    category,
    page,
  };

  return (
    <CelebrityBrowser
      initialData={initialData}
      categories={categories}
      initialFilters={initialFilters}
    />
  );
}
