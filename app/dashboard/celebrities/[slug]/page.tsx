import { notFound } from "next/navigation";

import { getCelebrityBySlug } from "@/lib/actions/client/celebrities";
import CelebrityProfile from "@/components/dashboard/CelebrityProfile";
import { pageTitle } from "@/lib/site-config";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await getCelebrityBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: pageTitle("Celebrity Not Found"),
    };
  }

  return {
    title: pageTitle(result.data.name),
    description: result.data.shortBio || result.data.bio?.slice(0, 160),
  };
}

export default async function CelebrityProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getCelebrityBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  return <CelebrityProfile celebrity={result.data} />;
}
