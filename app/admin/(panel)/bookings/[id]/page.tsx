import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/actions/admin/bookings";
import BookingDetailClient from "@/components/admin/BookingDetailClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Booking Details"),
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getBookingById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <BookingDetailClient booking={result.data} />;
}
