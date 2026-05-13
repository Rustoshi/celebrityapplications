import { getCelebrities } from "@/lib/actions/admin/celebrities";
import CelebritiesClient from "@/components/admin/CelebritiesClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Celebrities"),
};

interface PageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function CelebritiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const category = params.category || "all";
  const status = params.status || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getCelebrities({
    query: query || undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
    page,
  });

  const initialData = result.success && result.data
    ? result.data
    : {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };

  const initialFilters = {
    query,
    category,
    status,
    page,
  };

  return (
    <CelebritiesClient initialData={initialData} initialFilters={initialFilters} />
  );
}
