"use server";

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { ContactMessage } from "@/lib/models";
import { ITEMS_PER_PAGE } from "@/lib/constants";

interface SerializedMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface GetMessagesParams {
  query?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function serializeMessage(doc: Record<string, unknown>): SerializedMessage {
  return {
    _id: String(doc._id),
    name: doc.name as string,
    email: doc.email as string,
    phone: doc.phone as string | undefined,
    subject: doc.subject as string,
    message: doc.message as string,
    status: doc.status as string,
    adminReply: doc.adminReply as string | undefined,
    repliedAt: doc.repliedAt
      ? new Date(doc.repliedAt as Date).toISOString()
      : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Get paginated, filterable message list
 */
export async function getMessages(params: GetMessagesParams = {}) {
  try {
    await connectDB();
    await requireAdmin();

    const {
      query = "",
      status,
      page = 1,
      limit = ITEMS_PER_PAGE,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const filter: Record<string, unknown> = {};

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { subject: { $regex: query, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: messages.map((m) => serializeMessage(m as unknown as Record<string, unknown>)),
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return {
      success: false,
      error: "Failed to fetch messages",
    };
  }
}

/**
 * Get single message by ID (auto-marks as read if unread)
 */
export async function getMessageById(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const message = await ContactMessage.findById(id);

    if (!message) {
      return {
        success: false,
        error: "Message not found",
      };
    }

    if (message.status === "unread") {
      message.status = "read";
      await message.save();
    }

    return {
      success: true,
      data: serializeMessage(message.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error fetching message:", error);
    return {
      success: false,
      error: "Failed to fetch message",
    };
  }
}

/**
 * Reply to a message
 */
export async function replyToMessage(id: string, reply: string) {
  try {
    await connectDB();
    await requireAdmin();

    if (!reply || reply.trim().length === 0) {
      return {
        success: false,
        error: "Reply cannot be empty",
      };
    }

    if (reply.length > 5000) {
      return {
        success: false,
        error: "Reply cannot exceed 5000 characters",
      };
    }

    const message = await ContactMessage.findById(id);
    if (!message) {
      return {
        success: false,
        error: "Message not found",
      };
    }

    message.adminReply = reply.trim();
    message.repliedAt = new Date();
    message.status = "replied";
    await message.save();

    return {
      success: true,
      data: serializeMessage(message.toObject() as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error replying to message:", error);
    return {
      success: false,
      error: "Failed to send reply",
    };
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(id: string, status: string) {
  try {
    await connectDB();
    await requireAdmin();

    if (!["unread", "read", "replied", "archived"].includes(status)) {
      return {
        success: false,
        error: "Invalid status",
      };
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!message) {
      return {
        success: false,
        error: "Message not found",
      };
    }

    return {
      success: true,
      data: serializeMessage(message as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Error updating message status:", error);
    return {
      success: false,
      error: "Failed to update message status",
    };
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(id: string) {
  try {
    await connectDB();
    await requireAdmin();

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return {
        success: false,
        error: "Message not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting message:", error);
    return {
      success: false,
      error: "Failed to delete message",
    };
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount() {
  try {
    await connectDB();
    await requireAdmin();

    const count = await ContactMessage.countDocuments({ status: "unread" });

    return {
      success: true,
      data: count,
    };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return {
      success: false,
      error: "Failed to get unread count",
    };
  }
}
