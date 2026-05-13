import { redirect } from "next/navigation";

import { getCelebrityBySlug } from "@/lib/actions/client/celebrities";
import BookingForm from "@/components/dashboard/BookingForm";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("New Booking"),
};

interface PageProps {
  searchParams: Promise<{
    celebrity?: string;
    type?: string;
  }>;
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params.celebrity) {
    redirect("/dashboard/celebrities");
  }

  const result = await getCelebrityBySlug(params.celebrity);

  if (!result.success || !result.data) {
    redirect("/dashboard/celebrities");
  }

  const celebrity = result.data;

  const formCelebrity = {
    _id: celebrity._id,
    name: celebrity.name,
    slug: celebrity.slug,
    profileImage: celebrity.profileImage,
    category: celebrity.category,
    availableServices: celebrity.availableServices,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
          New Booking
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          Fill out the details below to submit your booking request
        </p>
      </div>

      <BookingForm celebrity={formCelebrity} preselectedType={params.type} />
    </div>
  );
}
