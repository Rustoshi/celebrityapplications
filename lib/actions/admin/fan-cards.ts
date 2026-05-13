"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { FanCard, FanCardOrder, Celebrity, User } from "@/lib/models";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { fanCardSchema, fanCardOrderStatusSchema } from "@/lib/validations/fan-card";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import {
  sendFanCardOrderConfirmedEmail,
  sendFanCardOrderDeliveredEmail,
  sendFanCardOrderCancelledEmail,
} from "@/lib/email";

/* ─── Serialization Helpers ─── */

interface SerializedFanCard {
  _id: string;
  celebrityId: string;
  celebrityName: string;
  cardNumber: string;
  title: string;
  description?: string;
  design: { url: string; publicId: string };
  backDesign?: { url: string; publicId: string };
  price: number;
  currency: string;
  isLimitedEdition: boolean;
  totalIssued: number;
  maxIssue: number;
  remainingSlots: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SerializedFanCardOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  fanCardId: string;
  fanCardTitle: string;
  celebrityId: string;
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
  updatedAt: string;
}

function serializeFanCard(doc: Record<string, unknown>): SerializedFanCard {
  const celebrity = doc.celebrityId as Record<string, unknown> | undefined;
  const design = doc.design as { url: string; publicId: string };
  const backDesign = doc.backDesign as { url: string; publicId: string } | undefined;

  return {
    _id: String(doc._id),
    celebrityId: celebrity?._id ? String(celebrity._id) : String(doc.celebrityId),
    celebrityName: (celebrity?.name as string) || "Unknown",
    cardNumber: doc.cardNumber as string,
    title: doc.title as string,
    description: doc.description as string | undefined,
    design: { url: design?.url || "", publicId: design?.publicId || "" },
    backDesign: backDesign?.url ? { url: backDesign.url, publicId: backDesign.publicId } : undefined,
    price: doc.price as number,
    currency: (doc.currency as string) || "USD",
    isLimitedEdition: Boolean(doc.isLimitedEdition),
    totalIssued: (doc.totalIssued as number) || 0,
    maxIssue: (doc.maxIssue as number) || 0,
    remainingSlots: doc.isLimitedEdition && (doc.maxIssue as number) > 0
      ? Math.max(0, (doc.maxIssue as number) - ((doc.totalIssued as number) || 0))
      : Infinity,
    isActive: Boolean(doc.isActive),
    sortOrder: (doc.sortOrder as number) || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as Date).toISOString() : new Date().toISOString(),
  };
}

function serializeFanCardOrder(doc: Record<string, unknown>): SerializedFanCardOrder {
  const user = doc.userId as Record<string, unknown> | undefined;
  const fanCard = doc.fanCardId as Record<string, unknown> | undefined;
  const celebrity = doc.celebrityId as Record<string, unknown> | undefined;

  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber as string,
    userId: user?._id ? String(user._id) : String(doc.userId),
    userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown",
    userEmail: (user?.email as string) || "",
    fanCardId: fanCard?._id ? String(fanCard._id) : String(doc.fanCardId),
    fanCardTitle: (fanCard?.title as string) || "Unknown",
    celebrityId: celebrity?._id ? String(celebrity._id) : String(doc.celebrityId),
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
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as Date).toISOString() : new Date().toISOString(),
  };
}

/* ─── Fan Card CRUD ─── */

/**
 * Get all fan cards with celebrity info
 */
export async function getFanCards(params?: {
  query?: string;
  celebrityId?: string;
  status?: string;
  page?: number;
}) {
  try {
    await connectDB();
    await requireAdmin();

    const page = params?.page || 1;
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params?.query) {
      filter.$or = [
        { title: { $regex: params.query, $options: "i" } },
        { cardNumber: { $regex: params.query, $options: "i" } },
      ];
    }

    if (params?.celebrityId) {
      filter.celebrityId = params.celebrityId;
    }

    if (params?.status === "active") filter.isActive = true;
    if (params?.status === "inactive") filter.isActive = false;
    if (params?.status === "limited") filter.isLimitedEdition = true;

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
        data: cards.map((c) => serializeFanCard(c as unknown as Record<string, unknown>)),
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

/**
 * Get single fan card by ID
 */
export async function getFanCardById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const card = await FanCard.findById(id)
      .populate("celebrityId", "name slug profileImage")
      .lean();

    if (!card) {
      return { success: false, error: "Fan card not found" };
    }

    return {
      success: true,
      data: serializeFanCard(card as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching fan card:", error);
    return { success: false, error: "Failed to fetch fan card" };
  }
}

/**
 * Create new fan card
 */
export async function createFanCard(data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = fanCardSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const celebrity = await Celebrity.findById(validation.data.celebrityId);
    if (!celebrity) {
      return { success: false, error: "Celebrity not found" };
    }

    // Upload design image
    const designResult = await uploadImage(validation.data.design, "fan-cards");
    const design = { url: designResult.url, publicId: designResult.publicId };

    let backDesign;
    if (validation.data.backDesign) {
      const backResult = await uploadImage(validation.data.backDesign, "fan-cards");
      backDesign = { url: backResult.url, publicId: backResult.publicId };
    }

    const card = new FanCard({
      celebrityId: validation.data.celebrityId,
      title: validation.data.title,
      description: validation.data.description,
      design,
      backDesign,
      price: validation.data.price,
      isLimitedEdition: validation.data.isLimitedEdition,
      maxIssue: validation.data.maxIssue,
      isActive: validation.data.isActive,
      sortOrder: validation.data.sortOrder,
    });

    await card.save();

    return {
      success: true,
      data: serializeFanCard(card.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating fan card:", error);
    return { success: false, error: "Failed to create fan card" };
  }
}

/**
 * Update fan card
 */
export async function updateFanCard(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = fanCardSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const card = await FanCard.findById(id);
    if (!card) {
      return { success: false, error: "Fan card not found" };
    }

    // Handle design image update
    if (validation.data.design && validation.data.design !== card.design?.url) {
      if (card.design?.publicId) {
        try { await deleteImage(card.design.publicId); } catch (e) { console.error("Delete old design:", e); }
      }
      const designResult = await uploadImage(validation.data.design, "fan-cards");
      card.design = { url: designResult.url, publicId: designResult.publicId };
    }

    // Handle back design image update
    if (validation.data.backDesign && validation.data.backDesign !== card.backDesign?.url) {
      if (card.backDesign?.publicId) {
        try { await deleteImage(card.backDesign.publicId); } catch (e) { console.error("Delete old back design:", e); }
      }
      const backResult = await uploadImage(validation.data.backDesign, "fan-cards");
      card.backDesign = { url: backResult.url, publicId: backResult.publicId };
    } else if (!validation.data.backDesign && card.backDesign?.publicId) {
      try { await deleteImage(card.backDesign.publicId); } catch (e) { console.error("Delete back design:", e); }
      card.backDesign = undefined;
    }

    card.celebrityId = validation.data.celebrityId as unknown as typeof card.celebrityId;
    card.title = validation.data.title;
    card.description = validation.data.description || undefined;
    card.price = validation.data.price as number;
    card.isLimitedEdition = validation.data.isLimitedEdition;
    card.maxIssue = validation.data.maxIssue as number;
    card.isActive = validation.data.isActive;
    card.sortOrder = validation.data.sortOrder as number;

    await card.save();

    const populated = await FanCard.findById(card._id)
      .populate("celebrityId", "name slug profileImage")
      .lean();

    return {
      success: true,
      data: serializeFanCard(populated as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating fan card:", error);
    return { success: false, error: "Failed to update fan card" };
  }
}

/**
 * Delete fan card
 */
export async function deleteFanCard(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const card = await FanCard.findById(id);
    if (!card) {
      return { success: false, error: "Fan card not found" };
    }

    // Check for active orders
    const activeOrders = await FanCardOrder.countDocuments({
      fanCardId: id,
      status: { $in: ["pending", "payment_pending", "confirmed"] },
    });

    if (activeOrders > 0) {
      return { success: false, error: `Cannot delete: ${activeOrders} active order(s) exist` };
    }

    // Delete images
    if (card.design?.publicId) {
      try { await deleteImage(card.design.publicId); } catch (e) { console.error("Delete design:", e); }
    }
    if (card.backDesign?.publicId) {
      try { await deleteImage(card.backDesign.publicId); } catch (e) { console.error("Delete back design:", e); }
    }

    await FanCard.findByIdAndDelete(id);

    return { success: true };
  } catch (error) {
    console.error("Error deleting fan card:", error);
    return { success: false, error: "Failed to delete fan card" };
  }
}

/**
 * Toggle fan card active status
 */
export async function toggleFanCardStatus(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const card = await FanCard.findById(id);
    if (!card) {
      return { success: false, error: "Fan card not found" };
    }

    card.isActive = !card.isActive;
    await card.save();

    return { success: true, data: { isActive: card.isActive } };
  } catch (error) {
    console.error("Error toggling fan card status:", error);
    return { success: false, error: "Failed to toggle fan card status" };
  }
}

/* ─── Fan Card Order Management ─── */

/**
 * Get fan card orders with filters and pagination
 */
export async function getFanCardOrders(params?: {
  query?: string;
  status?: string;
  page?: number;
}) {
  try {
    await connectDB();
    await requireAdmin();

    const page = params?.page || 1;
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params?.status && params.status !== "all") {
      filter.status = params.status;
    }

    const [orders, total] = await Promise.all([
      FanCardOrder.find(filter)
        .populate("userId", "firstName lastName email avatar")
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
        data: orders.map((o) => serializeFanCardOrder(o as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching fan card orders:", error);
    return { success: false, error: "Failed to fetch fan card orders" };
  }
}

/**
 * Update fan card order status
 */
export async function updateFanCardOrderStatus(
  orderId: string,
  data: Record<string, unknown>
) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = fanCardOrderStatusSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const order = await FanCardOrder.findById(orderId);
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const prevStatus = order.status;
    order.status = validation.data.status as typeof order.status;

    if (validation.data.adminNote) {
      order.adminNote = validation.data.adminNote;
    }

    // Set timestamps based on new status
    if (validation.data.status === "confirmed" && prevStatus !== "confirmed") {
      order.confirmedAt = new Date();
      // Increment totalIssued on the fan card
      await FanCard.findByIdAndUpdate(order.fanCardId, { $inc: { totalIssued: 1 } });
    }
    if (validation.data.status === "delivered" && prevStatus !== "delivered") {
      order.deliveredAt = new Date();
    }
    if (validation.data.status === "cancelled" && prevStatus !== "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    // Send email notification (non-blocking)
    if (validation.data.status !== prevStatus) {
      const user = await User.findById(order.userId).select("firstName email").lean();
      if (user?.email) {
        const email = user.email as string;
        const firstName = user.firstName as string;
        const orderNum = order.orderNumber;

        switch (validation.data.status) {
          case "confirmed":
            sendFanCardOrderConfirmedEmail(email, firstName, orderNum).catch(() => {});
            break;
          case "delivered":
            sendFanCardOrderDeliveredEmail(email, firstName, orderNum).catch(() => {});
            break;
          case "cancelled":
            sendFanCardOrderCancelledEmail(email, firstName, orderNum, validation.data.adminNote).catch(() => {});
            break;
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating fan card order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

/**
 * Get celebrities list for fan card creation dropdown
 */
export async function getCelebritiesForDropdown() {
  try {
    await connectDB();
    await requireAdmin();

    const celebrities = await Celebrity.find({ isActive: true })
      .select("name slug profileImage")
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      data: celebrities.map((c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        profileImage: c.profileImage ? { url: c.profileImage.url } : undefined,
      })),
    };
  } catch (error) {
    console.error("Error fetching celebrities for dropdown:", error);
    return { success: false, error: "Failed to fetch celebrities" };
  }
}
