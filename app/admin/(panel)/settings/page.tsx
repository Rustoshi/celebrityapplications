import { getSiteSettings, getAdminProfile, getAdminList } from "@/lib/actions/admin/settings";
import SettingsClient from "@/components/admin/SettingsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Settings"),
};

export default async function SettingsPage() {
  const [settingsResult, profileResult, adminsResult] = await Promise.all([
    getSiteSettings(),
    getAdminProfile(),
    getAdminList(),
  ]);

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">Failed to load settings</p>
      </div>
    );
  }

  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">Failed to load profile</p>
      </div>
    );
  }

  const isSuperAdmin = profileResult.data.role === "super_admin";
  const admins = adminsResult.success && adminsResult.data ? adminsResult.data : [];

  return (
    <SettingsClient
      settings={settingsResult.data}
      profile={profileResult.data}
      admins={admins}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
