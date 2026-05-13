import { getMessages } from "@/lib/actions/admin/messages";
import MessagesClient from "@/components/admin/MessagesClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Messages"),
};

interface PageProps {
  searchParams: Promise<{
    query?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const status = params.status || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getMessages({
    query: query || undefined,
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
    status,
    page,
  };

  return <MessagesClient initialData={initialData} initialFilters={initialFilters} />;
}
