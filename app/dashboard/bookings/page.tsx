import { getMyBookings } from "@/lib/actions/client/bookings";
import MyBookingsClient from "@/components/dashboard/MyBookingsClient";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("My Bookings"),
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

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

export default async function MyBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const status = params.status || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getMyBookings({
    status: status !== "all" ? status : undefined,
    page,
  });

  const initialData: {
    data: SerializedClientBooking[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  } =
    result.success && result.data
      ? {
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
        }
      : {
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false,
        };

  const initialFilters = {
    status,
    page,
  };

  return (
    <MyBookingsClient initialData={initialData} initialFilters={initialFilters} />
  );
}
