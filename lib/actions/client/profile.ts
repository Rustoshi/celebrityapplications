"use server";

import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { requireClient } from "@/lib/auth-utils";
import { User, BookingRequest } from "@/lib/models";
import { deleteImage } from "@/lib/cloudinary";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface SerializedProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: CloudinaryImage;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  bio?: string;
  company?: string;
  status: string;
  emailVerified: boolean;
  totalBookings: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

function serializeProfile(doc: Record<string, unknown>): SerializedProfile {
  return {
    _id: String(doc._id),
    firstName: doc.firstName as string,
    lastName: doc.lastName as string,
    email: doc.email as string,
    phone: doc.phone as string | undefined,
    avatar: doc.avatar as CloudinaryImage | undefined,
    dateOfBirth: doc.dateOfBirth
      ? (doc.dateOfBirth as Date).toISOString()
      : undefined,
    gender: doc.gender as string | undefined,
    country: doc.country as string | undefined,
    city: doc.city as string | undefined,
    address: doc.address as string | undefined,
    bio: doc.bio as string | undefined,
    company: doc.company as string | undefined,
    status: doc.status as string,
    emailVerified: doc.emailVerified as boolean,
    totalBookings: (doc.totalBookings as number) || 0,
    totalSpent: (doc.totalSpent as number) || 0,
    createdAt: doc.createdAt
      ? (doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? (doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

export async function getMyProfile(): Promise<{
  success: boolean;
  data?: SerializedProfile;
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: serializeProfile(user as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateMyProfile(
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  data?: SerializedProfile;
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const validation = updateProfileSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues;
      const firstError = issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid profile data",
      };
    }

    const updateData: Record<string, unknown> = { ...validation.data };

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth as string);
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: serializeProfile(updatedUser as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateAvatar(avatar: CloudinaryImage): Promise<{
  success: boolean;
  data?: { avatar: CloudinaryImage };
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const user = await User.findById(session.user.id).select("avatar");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.avatar?.publicId) {
      await deleteImage(user.avatar.publicId).catch(console.error);
    }

    user.avatar = avatar;
    await user.save();

    return {
      success: true,
      data: { avatar: user.avatar },
    };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function removeAvatar(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const user = await User.findById(session.user.id).select("avatar");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.avatar?.publicId) {
      await deleteImage(user.avatar.publicId);
    }

    user.avatar = undefined;
    await user.save();

    return { success: true };
  } catch (error) {
    console.error("Error removing avatar:", error);
    return { success: false, error: "Failed to remove avatar" };
  }
}

export async function changePassword(
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const validation = changePasswordSchema.safeParse(data);
    if (!validation.success) {
      const issues = validation.error.issues;
      const firstError = issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid password data",
      };
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await User.findById(session.user.id).select("password");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return { success: false, error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export async function deleteMyAccount(password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const session = await requireClient();

    const user = await User.findById(session.user.id).select("password avatar");

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { success: false, error: "Incorrect password" };
    }

    await BookingRequest.deleteMany({ userId: session.user.id });

    if (user.avatar?.publicId) {
      await deleteImage(user.avatar.publicId);
    }

    await User.findByIdAndDelete(session.user.id);

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
