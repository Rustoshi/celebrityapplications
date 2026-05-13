import { getAvailableFanCards, getMyFanCardOrders } from "@/lib/actions/client/fan-cards";
import FanCardsClient from "@/components/dashboard/FanCardsClient";
import { pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Fan Cards"),
};

export default async function FanCardsPage() {
  const [cardsResult, ordersResult] = await Promise.all([
    getAvailableFanCards({ page: 1 }),
    getMyFanCardOrders({ page: 1 }),
  ]);

  const initialCards = cardsResult.success && cardsResult.data
    ? cardsResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  const initialOrders = ordersResult.success && ordersResult.data
    ? ordersResult.data
    : { data: [], total: 0, page: 1, totalPages: 0, hasMore: false };

  return <FanCardsClient initialCards={initialCards} initialOrders={initialOrders} />;
}
