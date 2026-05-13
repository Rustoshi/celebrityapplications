import { notFound } from "next/navigation";

import {
  getMyBookingById,
  getActivePaymentMethods,
} from "@/lib/actions/client/bookings";
import BookingDetailView from "@/components/dashboard/BookingDetailView";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Booking Details"),
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [bookingResult, paymentMethodsResult] = await Promise.all([
    getMyBookingById(id),
    getActivePaymentMethods(),
  ]);

  if (!bookingResult.success || !bookingResult.data) {
    notFound();
  }

  const paymentMethods =
    paymentMethodsResult.success && paymentMethodsResult.data
      ? paymentMethodsResult.data
      : [];

  return (
    <div className="max-w-3xl mx-auto">
      <BookingDetailView
        booking={bookingResult.data}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
