import { redirect } from "next/navigation";

import { getMyProfile } from "@/lib/actions/client/profile";
import ProfileClient from "@/components/dashboard/ProfileClient";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Profile"),
};

export default async function ProfilePage() {
  const result = await getMyProfile();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  return <ProfileClient profile={result.data} />;
}
