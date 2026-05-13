import { getPaymentMethods } from "@/lib/actions/admin/payment-methods";
import PaymentMethodsClient from "@/components/admin/PaymentMethodsClient";
import { adminPageTitle } from "@/lib/site-config";

export const metadata = {
  title: adminPageTitle("Payment Methods"),
};

export default async function PaymentMethodsPage() {
  const result = await getPaymentMethods();

  const initialData = result.success && result.data ? result.data : [];

  return <PaymentMethodsClient initialData={initialData} />;
}
