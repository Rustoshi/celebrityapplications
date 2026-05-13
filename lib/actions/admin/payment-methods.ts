"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { PaymentMethod } from "@/lib/models";
import { deleteImage } from "@/lib/cloudinary";
import { paymentMethodSchema } from "@/lib/validations/payment-method";
import type { PaymentMethodType } from "@/types";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface PaymentMethodDetails {
  walletAddress?: string;
  network?: string;
  qrCodeImage?: CloudinaryImage;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  ibanNumber?: string;
  bankAddress?: string;
  email?: string;
  paypalLink?: string;
  acceptedBrands?: string[];
  redemptionInstructions?: string;
  [key: string]: unknown;
}

interface SerializedPaymentMethod {
  _id: string;
  type: string;
  label: string;
  instructions?: string;
  details: PaymentMethodDetails;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function serializePaymentMethod(doc: Record<string, unknown>): SerializedPaymentMethod {
  return {
    _id: String(doc._id),
    type: doc.type as string,
    label: doc.label as string,
    instructions: doc.instructions as string | undefined,
    details: (doc.details as PaymentMethodDetails) || {},
    isActive: Boolean(doc.isActive),
    sortOrder: (doc.sortOrder as number) || 0,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Get all payment methods
 */
export async function getPaymentMethods() {
  try {
    await connectDB();
    await requireAdmin();

    const methods = await PaymentMethod.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return {
      success: true,
      data: methods.map((m) => serializePaymentMethod(m as unknown as Record<string, unknown>)),
    };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return {
      success: false,
      error: "Failed to fetch payment methods",
    };
  }
}

/**
 * Get single payment method by ID
 */
export async function getPaymentMethodById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const method = await PaymentMethod.findById(id).lean();

    if (!method) {
      return {
        success: false,
        error: "Payment method not found",
      };
    }

    return {
      success: true,
      data: serializePaymentMethod(method as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return {
      success: false,
      error: "Failed to fetch payment method",
    };
  }
}

/**
 * Create new payment method
 */
export async function createPaymentMethod(data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = paymentMethodSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const methodDoc = new PaymentMethod({
      type: validation.data.type as PaymentMethodType,
      label: validation.data.label,
      instructions: validation.data.instructions,
      details: validation.data.details,
      isActive: validation.data.isActive,
      sortOrder: validation.data.sortOrder,
    });

    await methodDoc.save();

    return {
      success: true,
      data: serializePaymentMethod(methodDoc.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating payment method:", error);
    return {
      success: false,
      error: "Failed to create payment method",
    };
  }
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = paymentMethodSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return {
        success: false,
        error: firstError || "Invalid data",
      };
    }

    const method = await PaymentMethod.findByIdAndUpdate(id, validation.data, {
      new: true,
    }).lean();

    if (!method) {
      return {
        success: false,
        error: "Payment method not found",
      };
    }

    return {
      success: true,
      data: serializePaymentMethod(method as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating payment method:", error);
    return {
      success: false,
      error: "Failed to update payment method",
    };
  }
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const method = await PaymentMethod.findById(id);
    if (!method) {
      return {
        success: false,
        error: "Payment method not found",
      };
    }

    if (method.details?.qrCodeImage?.publicId) {
      try {
        await deleteImage(method.details.qrCodeImage.publicId);
      } catch (err) {
        console.error("Failed to delete QR code image:", err);
      }
    }

    await PaymentMethod.findByIdAndDelete(id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return {
      success: false,
      error: "Failed to delete payment method",
    };
  }
}

/**
 * Toggle payment method active status
 */
export async function togglePaymentMethodStatus(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const method = await PaymentMethod.findById(id);
    if (!method) {
      return {
        success: false,
        error: "Payment method not found",
      };
    }

    method.isActive = !method.isActive;
    await method.save();

    return {
      success: true,
      data: { isActive: method.isActive },
    };
  } catch (error) {
    console.error("Error toggling payment method status:", error);
    return {
      success: false,
      error: "Failed to toggle payment method status",
    };
  }
}

/**
 * Reorder payment methods
 */
export async function reorderPaymentMethods(orderedIds: string[]) {
  try {
    await connectDB();
    await requireAdmin();

    const updatePromises = orderedIds.map((id, index) =>
      PaymentMethod.findByIdAndUpdate(id, { sortOrder: index })
    );

    await Promise.all(updatePromises);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error reordering payment methods:", error);
    return {
      success: false,
      error: "Failed to reorder payment methods",
    };
  }
}
