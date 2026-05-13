"use server";

import { connectDB } from "@/lib/db";
import { requireClient } from "@/lib/auth-utils";
import { MembershipTier, MembershipApplication, PaymentMethod, User } from "@/lib/models";
import { membershipApplicationSchema, membershipPaymentUploadSchema } from "@/lib/validations/membership";
import { uploadImage } from "@/lib/cloudinary";
import { MEMBERSHIP_BILLING_CYCLES } from "@/lib/constants";
import { sendMembershipAppliedEmail } from "@/lib/email";

/* ─── Serialization ─── */

interface SerializedTier {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency: string;
  billingCycle: string;
  billingCycleLabel: string;
  features: string[];
  maxBookingsPerMonth: number;
  discountPercent: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
  exclusiveContent: boolean;
  badge?: { url: string };
  color?: string;
  isActive: boolean;
  totalMembers: number;
}

interface SerializedApplication {
  _id: string;
  tierId: string;
  tierName: string;
  membershipCardNumber: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  autoRenew: boolean;
  adminNote?: string;
  appliedAt: string;
  approvedAt?: string;
  activatedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

function serializeTier(doc: Record<string, unknown>): SerializedTier {
  const badge = doc.badge as { url: string; publicId: string } | undefined;
  const billingCycle = doc.billingCycle as string;
  const cycleInfo = MEMBERSHIP_BILLING_CYCLES.find((c) => c.value === billingCycle);

  return {
    _id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    description: doc.description as string | undefined,
    shortDescription: doc.shortDescription as string | undefined,
    price: doc.price as number,
    currency: (doc.currency as string) || "USD",
    billingCycle,
    billingCycleLabel: cycleInfo?.label || billingCycle,
    features: (doc.features as string[]) || [],
    maxBookingsPerMonth: (doc.maxBookingsPerMonth as number) || 0,
    discountPercent: (doc.discountPercent as number) || 0,
    prioritySupport: Boolean(doc.prioritySupport),
    earlyAccess: Boolean(doc.earlyAccess),
    exclusiveContent: Boolean(doc.exclusiveContent),
    badge: badge?.url ? { url: badge.url } : undefined,
    color: doc.color as string | undefined,
    isActive: Boolean(doc.isActive),
    totalMembers: (doc.totalMembers as number) || 0,
  };
}

function serializeApplication(doc: Record<string, unknown>): SerializedApplication {
  const tier = doc.tierId as Record<string, unknown> | undefined;

  return {
    _id: String(doc._id),
    tierId: tier?._id ? String(tier._id) : String(doc.tierId),
    tierName: (tier?.name as string) || "Unknown",
    membershipCardNumber: doc.membershipCardNumber as string,
    status: doc.status as string,
    amount: doc.amount as number,
    currency: (doc.currency as string) || "USD",
    paymentMethodUsed: doc.paymentMethodUsed as string | undefined,
    paymentMethodType: doc.paymentMethodType as string | undefined,
    paymentReceipt: doc.paymentReceipt as string | undefined,
    autoRenew: Boolean(doc.autoRenew),
    adminNote: doc.adminNote as string | undefined,
    appliedAt: doc.appliedAt ? new Date(doc.appliedAt as Date).toISOString() : new Date().toISOString(),
    approvedAt: doc.approvedAt ? new Date(doc.approvedAt as Date).toISOString() : undefined,
    activatedAt: doc.activatedAt ? new Date(doc.activatedAt as Date).toISOString() : undefined,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt as Date).toISOString() : undefined,
    cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt as Date).toISOString() : undefined,
    cancellationReason: doc.cancellationReason as string | undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
  };
}

/* ─── Browse Tiers ─── */

/**
 * Get active membership tiers for client browsing
 */
export async function getActiveMembershipTiers() {
  try {
    await connectDB();
    await requireClient();

    const tiers = await MembershipTier.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    return {
      success: true,
      data: tiers.map((t) => serializeTier(t as unknown as Record<string, unknown>)),
    };
  } catch (error) {
    console.error("Error fetching membership tiers:", error);
    return { success: false, error: "Failed to fetch membership tiers" };
  }
}

/* ─── Apply for Membership ─── */

/**
 * Submit a membership application
 */
export async function applyForMembership(data: Record<string, unknown>) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const validation = membershipApplicationSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const tier = await MembershipTier.findById(validation.data.tierId);
    if (!tier || !tier.isActive) {
      return { success: false, error: "Membership tier not available" };
    }

    // Check for existing active/pending application for same tier
    const existing = await MembershipApplication.findOne({
      userId,
      tierId: validation.data.tierId,
      status: { $in: ["pending", "active"] },
    });

    if (existing) {
      return {
        success: false,
        error: existing.status === "active"
          ? "You already have an active membership for this tier"
          : "You already have a pending application for this tier",
      };
    }

    const application = new MembershipApplication({
      userId,
      tierId: tier._id,
      status: "pending",
      amount: tier.price,
      currency: tier.currency || "USD",
      autoRenew: validation.data.autoRenew || false,
      appliedAt: new Date(),
    });

    await application.save();

    // Send email notification (non-blocking)
    const user = await User.findById(userId).select("firstName email").lean();
    if (user?.email) {
      sendMembershipAppliedEmail(
        user.email as string,
        user.firstName as string,
        tier.name,
        application.membershipCardNumber,
      ).catch(() => {});
    }

    return {
      success: true,
      data: {
        applicationId: String(application._id),
        membershipCardNumber: application.membershipCardNumber,
      },
    };
  } catch (error) {
    console.error("Error applying for membership:", error);
    return { success: false, error: "Failed to submit application" };
  }
}

/* ─── My Applications ─── */

/**
 * Get current user's membership applications
 */
export async function getMyMembershipApplications(params?: {
  status?: string;
  page?: number;
}) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const page = params?.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };

    if (params?.status && params.status !== "all") {
      filter.status = params.status;
    }

    const [applications, total] = await Promise.all([
      MembershipApplication.find(filter)
        .populate("tierId", "name slug price billingCycle color")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MembershipApplication.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: applications.map((a) => serializeApplication(a as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching my memberships:", error);
    return { success: false, error: "Failed to fetch applications" };
  }
}

/* ─── Upload Payment Receipt ─── */

/**
 * Upload payment receipt for a membership application
 */
export async function uploadMembershipPayment(data: {
  applicationId: string;
  paymentMethodUsed: string;
  paymentMethodType?: string;
  paymentReceipt: string;
}) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const validation = membershipPaymentUploadSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const application = await MembershipApplication.findOne({
      _id: validation.data.applicationId,
      userId,
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    if (application.status !== "pending") {
      return { success: false, error: "Payment can only be uploaded for pending applications" };
    }

    // Upload receipt image
    const receiptResult = await uploadImage(validation.data.paymentReceipt, "membership-receipts");

    application.paymentMethodUsed = validation.data.paymentMethodUsed;
    application.paymentMethodType = validation.data.paymentMethodType as typeof application.paymentMethodType;
    application.paymentReceipt = receiptResult.url;
    application.paymentReceiptPublicId = receiptResult.publicId;
    application.paymentUploadedAt = new Date();

    await application.save();

    return { success: true };
  } catch (error) {
    console.error("Error uploading membership payment:", error);
    return { success: false, error: "Failed to upload payment" };
  }
}

/**
 * Cancel a membership application (only if pending)
 */
export async function cancelMembershipApplication(applicationId: string) {
  try {
    await connectDB();
    const session = await requireClient();
    const userId = session.user.id;

    const application = await MembershipApplication.findOne({ _id: applicationId, userId });
    if (!application) {
      return { success: false, error: "Application not found" };
    }

    if (application.status !== "pending") {
      return { success: false, error: "Only pending applications can be cancelled" };
    }

    application.status = "cancelled";
    application.cancelledAt = new Date();
    application.cancellationReason = "Cancelled by user";

    await application.save();

    return { success: true };
  } catch (error) {
    console.error("Error cancelling membership application:", error);
    return { success: false, error: "Failed to cancel application" };
  }
}
