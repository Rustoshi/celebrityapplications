"use server";

import { connectDB } from "@/lib/db";
import { requireClient } from "@/lib/auth-utils";
import { FanCard, FanCardOrder, Celebrity, PaymentMethod, User } from "@/lib/models";
import { fanCardOrderSchema, fanCardPaymentUploadSchema } from "@/lib/validations/fan-card";
import { uploadImage } from "@/lib/cloudinary";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { sendFanCardOrderPlacedEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

/* ─── Serialization ─── */

interface SerializedFanCard {
  _id: string;
  celebrityId: string;
  celebrityName: string;
  celebritySlug: string;
  celebrityImage?: string;
  cardNumber: string;
  title: string;
  description?: string;
  design: { url: string };
  backDesign?: { url: string };
  price: number;
  currency: string;
  isLimitedEdition: boolean;
  totalIssued: number;
  maxIssue: number;
  remainingSlots: number;
  isActive: boolean;
}

interface SerializedOrder {
  _id: string;
  orderNumber: string;
  fanCardTitle: string;
  fanCardDesign?: string;
  celebrityName: string;
  status: string;
  amount: number;
  currency: string;
  deliveryType: string;
  shippingAddress?: Record<string, unknown>;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  adminNote?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

function serializeCard(doc: Record<string, unknown>): SerializedFanCard {
  const celebrity = doc.celebrityId as Record<string, unknown> | undefined;
  const design = doc.design as { url: string; publicId: string };
  const backDesign = doc.backDesign as { url: string } | undefined;

  return {
    _id: String(doc._id),
    celebrityId: celebrity?._id ? String(celebrity._id) : String(doc.celebrityId),
    celebrityName: (celebrity?.name as string) || "Unknown",
    celebritySlug: (celebrity?.slug as string) || "",
    celebrityImage: (celebrity?.profileImage as { url: string } | undefined)?.url,
    cardNumber: doc.cardNumber as string,
    title: doc.title as string,
    description: doc.description as string | undefined,
    design: { url: design?.url || "" },
    backDesign: backDesign?.url ? { url: backDesign.url } : undefined,
    price: doc.price as number,
    currency: (doc.currency as string) || "USD",
    isLimitedEdition: Boolean(doc.isLimitedEdition),
    totalIssued: (doc.totalIssued as number) || 0,
    maxIssue: (doc.maxIssue as number) || 0,
    remainingSlots: doc.isLimitedEdition && (doc.maxIssue as number) > 0
      ? Math.max(0, (doc.maxIssue as number) - ((doc.totalIssued as number) || 0))
      : Infinity,
    isActive: Boolean(doc.isActive),
  };
}

function serializeOrder(doc: Record<string, unknown>): SerializedOrder {
  const fanCard = doc.fanCardId as Record<string, unknown> | undefined;
  const celebrity = doc.celebrityId as Record<string, unknown> | undefined;
  const design = (fanCard?.design as { url: string } | undefined);

  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber as string,
    fanCardTitle: (fanCard?.title as string) || "Unknown",
    fanCardDesign: design?.url,
    celebrityName: (celebrity?.name as string) || "Unknown",
    status: doc.status as string,
    amount: doc.amount as number,
    currency: (doc.currency as string) || "USD",
    deliveryType: doc.deliveryType as string,
    shippingAddress: doc.shippingAddress as Record<string, unknown> | undefined,
    paymentMethodUsed: doc.paymentMethodUsed as string | undefined,
    paymentMethodType: doc.paymentMethodType as string | undefined,
    paymentReceipt: doc.paymentReceipt as string | undefined,
    adminNote: doc.adminNote as string | undefined,
    confirmedAt: doc.confirmedAt ? new Date(doc.confirmedAt as Date).toISOString() : undefined,
    deliveredAt: doc.deliveredAt ? new Date(doc.deliveredAt as Date).toISOString() : undefined,
    cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt as Date).toISOString() : undefined,
    cancellationReason: doc.cancellationReason as string | undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
  };
}

/* ─── Browse Fan Cards ─── */

/**
 * Get available fan cards for browsing (active only)
 */
export async function getAvailableFanCards(params?: {
  celebrityId?: string;
  page?: number;
}) {
  try {
    await connectDB();
    await requireClient();

    const page = params?.page || 1;
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };

    if (params?.celebrityId) {
      filter.celebrityId = params.celebrityId;
    }

    const [cards, total] = await Promise.all([
      FanCard.find(filter)
        .populate("celebrityId", "name slug profileImage")
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FanCard.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: cards.map((c) => serializeCard(c as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching fan cards:", error);
    return { success: false, error: "Failed to fetch fan cards" };
  }
}

/* ─── Order Fan Card ─── */

/**
 * Place a fan card order
 */
export async function orderFanCard(data: Record<string, unknown>) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const validation = fanCardOrderSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const card = await FanCard.findById(validation.data.fanCardId);
    if (!card || !card.isActive) {
      return { success: false, error: "Fan card not available" };
    }

    // Check limited edition availability
    if (card.isLimitedEdition && card.maxIssue > 0 && card.totalIssued >= card.maxIssue) {
      return { success: false, error: "This limited edition card is sold out" };
    }

    const order = new FanCardOrder({
      userId,
      fanCardId: card._id,
      celebrityId: card.celebrityId,
      status: "pending",
      amount: card.price,
      currency: card.currency,
      deliveryType: validation.data.deliveryType,
      shippingAddress: validation.data.shippingAddress,
    });

    await order.save();

    // Send email notification (non-blocking)
    const user = await User.findById(userId).select("firstName email").lean();
    if (user?.email) {
      sendFanCardOrderPlacedEmail(
        user.email as string,
        user.firstName as string,
        order.orderNumber,
        card.title,
        formatCurrency(card.price),
      ).catch(() => {});
    }

    return {
      success: true,
      data: { orderId: String(order._id), orderNumber: order.orderNumber },
    };
  } catch (error) {
    console.error("Error placing fan card order:", error);
    return { success: false, error: "Failed to place order" };
  }
}

/* ─── My Orders ─── */

/**
 * Get current user's fan card orders
 */
export async function getMyFanCardOrders(params?: {
  status?: string;
  page?: number;
}) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const page = params?.page || 1;
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };

    if (params?.status && params.status !== "all") {
      filter.status = params.status;
    }

    const [orders, total] = await Promise.all([
      FanCardOrder.find(filter)
        .populate("fanCardId", "title cardNumber design price")
        .populate("celebrityId", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FanCardOrder.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: orders.map((o) => serializeOrder(o as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching my fan card orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

/* ─── Upload Payment Receipt ─── */

/**
 * Upload payment receipt for a fan card order
 */
export async function uploadFanCardPayment(data: {
  orderId: string;
  paymentMethodUsed: string;
  paymentMethodType?: string;
  paymentReceipt: string;
}) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const validation = fanCardPaymentUploadSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const order = await FanCardOrder.findOne({
      _id: validation.data.orderId,
      userId,
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!["pending", "payment_pending"].includes(order.status)) {
      return { success: false, error: "Payment cannot be uploaded for this order" };
    }

    // Upload receipt image
    const receiptResult = await uploadImage(validation.data.paymentReceipt, "fan-card-receipts");

    order.paymentMethodUsed = validation.data.paymentMethodUsed;
    order.paymentMethodType = validation.data.paymentMethodType as typeof order.paymentMethodType;
    order.paymentReceipt = receiptResult.url;
    order.paymentReceiptPublicId = receiptResult.publicId;
    order.paymentUploadedAt = new Date();
    order.status = "payment_pending";

    await order.save();

    return { success: true };
  } catch (error) {
    console.error("Error uploading fan card payment:", error);
    return { success: false, error: "Failed to upload payment" };
  }
}

/**
 * Cancel a fan card order (only if pending or payment_pending)
 */
export async function cancelFanCardOrder(orderId: string) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const order = await FanCardOrder.findOne({ _id: orderId, userId });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!["pending", "payment_pending"].includes(order.status)) {
      return { success: false, error: "Only pending orders can be cancelled" };
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = "Cancelled by user";

    await order.save();

    return { success: true };
  } catch (error) {
    console.error("Error cancelling fan card order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}

/**
 * Get active payment methods for client use
 */
export async function getActivePaymentMethods() {
  try {
    await connectDB();
    await requireClient();

    const methods = await PaymentMethod.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    return {
      success: true,
      data: methods.map((m) => ({
        _id: String(m._id),
        type: m.type,
        label: m.label,
        instructions: m.instructions,
        details: m.details,
      })),
    };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return { success: false, error: "Failed to fetch payment methods" };
  }
}
