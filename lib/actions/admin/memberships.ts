"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { MembershipTier, MembershipApplication, User } from "@/lib/models";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { membershipTierSchema, membershipStatusSchema } from "@/lib/validations/membership";
import { generateSlug } from "@/lib/utils";
import { ITEMS_PER_PAGE, MEMBERSHIP_BILLING_CYCLES } from "@/lib/constants";
import {
  sendMembershipApprovedEmail,
  sendMembershipRejectedEmail,
  sendMembershipCancelledEmail,
} from "@/lib/email";

/* ─── Serialization Helpers ─── */

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
  badge?: { url: string; publicId: string };
  color?: string;
  isActive: boolean;
  sortOrder: number;
  totalMembers: number;
  createdAt: string;
  updatedAt: string;
}

interface SerializedApplication {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
  updatedAt: string;
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
    badge: badge?.url ? { url: badge.url, publicId: badge.publicId } : undefined,
    color: doc.color as string | undefined,
    isActive: Boolean(doc.isActive),
    sortOrder: (doc.sortOrder as number) || 0,
    totalMembers: (doc.totalMembers as number) || 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt as Date).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as Date).toISOString() : new Date().toISOString(),
  };
}

function serializeApplication(doc: Record<string, unknown>): SerializedApplication {
  const user = doc.userId as Record<string, unknown> | undefined;
  const tier = doc.tierId as Record<string, unknown> | undefined;

  return {
    _id: String(doc._id),
    userId: user?._id ? String(user._id) : String(doc.userId),
    userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown",
    userEmail: (user?.email as string) || "",
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
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as Date).toISOString() : new Date().toISOString(),
  };
}

/* ─── Membership Tier CRUD ─── */

/**
 * Get all membership tiers
 */
export async function getMembershipTiers() {
  try {
    await connectDB();
    await requireAdmin();

    const tiers = await MembershipTier.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
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

/**
 * Get single membership tier by ID
 */
export async function getMembershipTierById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const tier = await MembershipTier.findById(id).lean();
    if (!tier) {
      return { success: false, error: "Membership tier not found" };
    }

    return {
      success: true,
      data: serializeTier(tier as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching membership tier:", error);
    return { success: false, error: "Failed to fetch membership tier" };
  }
}

/**
 * Create new membership tier
 */
export async function createMembershipTier(data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = membershipTierSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const slug = generateSlug(validation.data.name);

    // Check for duplicate slug
    const existing = await MembershipTier.findOne({ slug });
    if (existing) {
      return { success: false, error: "A tier with this name already exists" };
    }

    let badge;
    if (validation.data.badge) {
      const badgeResult = await uploadImage(validation.data.badge, "membership-badges");
      badge = { url: badgeResult.url, publicId: badgeResult.publicId };
    }

    const tier = new MembershipTier({
      name: validation.data.name,
      slug,
      description: validation.data.description,
      shortDescription: validation.data.shortDescription,
      price: validation.data.price,
      billingCycle: validation.data.billingCycle,
      features: validation.data.features,
      maxBookingsPerMonth: validation.data.maxBookingsPerMonth,
      discountPercent: validation.data.discountPercent,
      prioritySupport: validation.data.prioritySupport,
      earlyAccess: validation.data.earlyAccess,
      exclusiveContent: validation.data.exclusiveContent,
      badge,
      color: validation.data.color,
      isActive: validation.data.isActive,
      sortOrder: validation.data.sortOrder,
    });

    await tier.save();

    return {
      success: true,
      data: serializeTier(tier.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error creating membership tier:", error);
    return { success: false, error: "Failed to create membership tier" };
  }
}

/**
 * Update membership tier
 */
export async function updateMembershipTier(id: string, data: Record<string, unknown>) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = membershipTierSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const tier = await MembershipTier.findById(id);
    if (!tier) {
      return { success: false, error: "Membership tier not found" };
    }

    // Update slug if name changed
    const newSlug = generateSlug(validation.data.name);
    if (newSlug !== tier.slug) {
      const existing = await MembershipTier.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existing) {
        return { success: false, error: "A tier with this name already exists" };
      }
      tier.slug = newSlug;
    }

    // Handle badge update
    if (validation.data.badge && validation.data.badge !== tier.badge?.url) {
      if (tier.badge?.publicId) {
        try { await deleteImage(tier.badge.publicId); } catch (e) { console.error("Delete old badge:", e); }
      }
      const badgeResult = await uploadImage(validation.data.badge, "membership-badges");
      tier.badge = { url: badgeResult.url, publicId: badgeResult.publicId };
    } else if (!validation.data.badge && tier.badge?.publicId) {
      try { await deleteImage(tier.badge.publicId); } catch (e) { console.error("Delete badge:", e); }
      tier.badge = undefined;
    }

    tier.name = validation.data.name;
    tier.description = validation.data.description || undefined;
    tier.shortDescription = validation.data.shortDescription || undefined;
    tier.price = validation.data.price as number;
    tier.billingCycle = validation.data.billingCycle as typeof tier.billingCycle;
    tier.features = validation.data.features;
    tier.maxBookingsPerMonth = validation.data.maxBookingsPerMonth as number;
    tier.discountPercent = validation.data.discountPercent as number;
    tier.prioritySupport = validation.data.prioritySupport;
    tier.earlyAccess = validation.data.earlyAccess;
    tier.exclusiveContent = validation.data.exclusiveContent;
    tier.color = validation.data.color || undefined;
    tier.isActive = validation.data.isActive;
    tier.sortOrder = validation.data.sortOrder as number;

    await tier.save();

    return {
      success: true,
      data: serializeTier(tier.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating membership tier:", error);
    return { success: false, error: "Failed to update membership tier" };
  }
}

/**
 * Delete membership tier
 */
export async function deleteMembershipTier(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const tier = await MembershipTier.findById(id);
    if (!tier) {
      return { success: false, error: "Membership tier not found" };
    }

    // Check for active applications
    const activeApps = await MembershipApplication.countDocuments({
      tierId: id,
      status: { $in: ["pending", "active"] },
    });

    if (activeApps > 0) {
      return { success: false, error: `Cannot delete: ${activeApps} active application(s) exist` };
    }

    if (tier.badge?.publicId) {
      try { await deleteImage(tier.badge.publicId); } catch (e) { console.error("Delete badge:", e); }
    }

    await MembershipTier.findByIdAndDelete(id);

    return { success: true };
  } catch (error) {
    console.error("Error deleting membership tier:", error);
    return { success: false, error: "Failed to delete membership tier" };
  }
}

/**
 * Toggle membership tier active status
 */
export async function toggleMembershipTierStatus(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const tier = await MembershipTier.findById(id);
    if (!tier) {
      return { success: false, error: "Membership tier not found" };
    }

    tier.isActive = !tier.isActive;
    await tier.save();

    return { success: true, data: { isActive: tier.isActive } };
  } catch (error) {
    console.error("Error toggling membership tier status:", error);
    return { success: false, error: "Failed to toggle tier status" };
  }
}

/* ─── Membership Application Management ─── */

/**
 * Get membership applications with filters and pagination
 */
export async function getMembershipApplications(params?: {
  query?: string;
  status?: string;
  tierId?: string;
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

    if (params?.tierId) {
      filter.tierId = params.tierId;
    }

    const [applications, total] = await Promise.all([
      MembershipApplication.find(filter)
        .populate("userId", "firstName lastName email avatar")
        .populate("tierId", "name slug price billingCycle")
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
    console.error("Error fetching membership applications:", error);
    return { success: false, error: "Failed to fetch membership applications" };
  }
}

/**
 * Update membership application status (approve, activate, cancel, expire)
 */
export async function updateMembershipApplicationStatus(
  applicationId: string,
  data: Record<string, unknown>
) {
  try {
    await connectDB();
    await requireAdmin();

    const validation = membershipStatusSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { success: false, error: firstError || "Invalid data" };
    }

    const application = await MembershipApplication.findById(applicationId);
    if (!application) {
      return { success: false, error: "Application not found" };
    }

    const prevStatus = application.status;
    application.status = validation.data.status as typeof application.status;

    if (validation.data.adminNote) {
      application.adminNote = validation.data.adminNote;
    }

    if (validation.data.status === "active" && prevStatus !== "active") {
      application.approvedAt = new Date();
      application.activatedAt = new Date();

      // Calculate expiry based on billing cycle
      const tier = await MembershipTier.findById(application.tierId);
      if (tier) {
        const cycleInfo = MEMBERSHIP_BILLING_CYCLES.find((c) => c.value === tier.billingCycle);
        if (cycleInfo && cycleInfo.months > 0) {
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + cycleInfo.months);
          application.expiresAt = expiry;
        }
        // Increment totalMembers
        await MembershipTier.findByIdAndUpdate(tier._id, { $inc: { totalMembers: 1 } });
      }
    }

    if (validation.data.status === "cancelled" && prevStatus !== "cancelled") {
      application.cancelledAt = new Date();
      // Decrement totalMembers if was active
      if (prevStatus === "active") {
        await MembershipTier.findByIdAndUpdate(application.tierId, {
          $inc: { totalMembers: -1 },
        });
      }
    }

    if (validation.data.status === "expired" && prevStatus !== "expired") {
      if (prevStatus === "active") {
        await MembershipTier.findByIdAndUpdate(application.tierId, {
          $inc: { totalMembers: -1 },
        });
      }
    }

    await application.save();

    // Send email notification (non-blocking)
    if (validation.data.status !== prevStatus) {
      const user = await User.findById(application.userId).select("firstName email").lean();
      const tier = await MembershipTier.findById(application.tierId).select("name").lean();
      if (user?.email && tier) {
        const email = user.email as string;
        const firstName = user.firstName as string;
        const tierName = tier.name as string;

        switch (validation.data.status) {
          case "active":
            sendMembershipApprovedEmail(email, firstName, tierName, application.membershipCardNumber).catch(() => {});
            break;
          case "cancelled":
            sendMembershipCancelledEmail(email, firstName, tierName, validation.data.adminNote).catch(() => {});
            break;
          case "expired":
            sendMembershipRejectedEmail(email, firstName, tierName, "Membership expired").catch(() => {});
            break;
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating membership application status:", error);
    return { success: false, error: "Failed to update application status" };
  }
}
