import { getActiveMembershipTiers, getMyMembershipApplications } from "@/lib/actions/client/memberships";
import MembershipsClient from "@/components/dashboard/MembershipsClient";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Memberships"),
};

export default async function MembershipsPage() {
  const [tiersResult, appsResult] = await Promise.all([
    getActiveMembershipTiers(),
    getMyMembershipApplications({ page: 1 }),
  ]);

  const initialTiers = tiersResult.success && tiersResult.data
    ? tiersResult.data
    : [];

  const initialApplications = appsResult.success && appsResult.data
    ? appsResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  return <MembershipsClient initialTiers={initialTiers} initialApplications={initialApplications} />;
}
