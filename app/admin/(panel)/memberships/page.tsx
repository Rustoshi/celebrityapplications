import { getMembershipTiers, getMembershipApplications } from "@/lib/actions/admin/memberships";
import MembershipsClient from "@/components/admin/MembershipsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Memberships"),
};

export default async function MembershipsPage() {
  const [tiersResult, appsResult] = await Promise.all([
    getMembershipTiers(),
    getMembershipApplications({ page: 1 }),
  ]);

  const initialTiers = tiersResult.success && tiersResult.data
    ? tiersResult.data
    : [];

  const initialApplications = appsResult.success && appsResult.data
    ? appsResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  return <MembershipsClient initialTiers={initialTiers} initialApplications={initialApplications} />;
}
