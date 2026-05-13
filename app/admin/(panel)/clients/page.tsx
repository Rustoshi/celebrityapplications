import { getClients } from "@/lib/actions/admin/clients";
import ClientsClient from "@/components/admin/ClientsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Clients"),
};

interface PageProps {
  searchParams: Promise<{
    query?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const query = params.query || "";
  const status = params.status || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getClients({
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

  return <ClientsClient initialData={initialData} initialFilters={initialFilters} />;
}
