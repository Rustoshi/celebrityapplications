import { getFanCards, getFanCardOrders } from "@/lib/actions/admin/fan-cards";
import FanCardsClient from "@/components/admin/FanCardsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Fan Cards"),
};

export default async function FanCardsPage() {
  const [cardsResult, ordersResult] = await Promise.all([
    getFanCards({ page: 1 }),
    getFanCardOrders({ page: 1 }),
  ]);

  const initialCards = cardsResult.success && cardsResult.data
    ? cardsResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  const initialOrders = ordersResult.success && ordersResult.data
    ? ordersResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  return <FanCardsClient initialCards={initialCards} initialOrders={initialOrders} />;
}
