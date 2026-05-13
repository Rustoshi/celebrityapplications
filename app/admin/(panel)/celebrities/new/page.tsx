import CelebrityForm from "@/components/admin/CelebrityForm";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Add Celebrity"),
};

export default function NewCelebrityPage() {
  return <CelebrityForm />;
}
