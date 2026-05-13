import { notFound } from "next/navigation";
import { getCelebrityById } from "@/lib/actions/admin/celebrities";
import CelebrityForm from "@/components/admin/CelebrityForm";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Edit Celebrity"),
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCelebrityPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getCelebrityById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <CelebrityForm celebrity={result.data} isEditing />;
}
