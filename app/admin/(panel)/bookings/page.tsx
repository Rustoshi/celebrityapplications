import { getBookings } from "@/lib/actions/admin/bookings";
import BookingsClient from "@/components/admin/BookingsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Bookings"),
};

interface PageProps {
  searchParams: Promise<{
    query?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const status = params.status || "all";
  const type = params.type || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getBookings({
    query: query || undefined,
    status: status !== "all" ? status : undefined,
    type: type !== "all" ? type : undefined,
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
    status,
    type,
    page,
  };

  return <BookingsClient initialData={initialData} initialFilters={initialFilters} />;
}
