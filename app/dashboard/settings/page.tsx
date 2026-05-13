import { redirect } from "next/navigation";

import { getMyProfile } from "@/lib/actions/client/profile";
import SettingsClient from "@/components/dashboard/SettingsClient";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Settings"),
};

export default async function SettingsPage() {
  const result = await getMyProfile();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const profile = {
    _id: result.data._id,
    firstName: result.data.firstName,
    email: result.data.email,
    status: result.data.status,
    createdAt: result.data.createdAt,
  };

  return <SettingsClient profile={profile} />;
}
