"use server";

import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { contactSchema } from "@/lib/validations";
import { sendContactAutoReply } from "@/lib/email";

export async function submitContactMessage(
  data: Record<string, unknown>
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const validation = contactSchema.safeParse(data);

    if (!validation.success) {
      const issues = validation.error.issues;
      const firstError = issues[0];
      return {
        success: false,
        error: firstError?.message || "Invalid form data",
      };
    }

    await connectDB();

    const { name, email, phone, subject, message } = validation.data;

    const recentMessage = await ContactMessage.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentMessage) {
      return {
        success: false,
        error: "Please wait a few minutes before sending another message",
      };
    }

    await ContactMessage.create({
      name,
      email: email.toLowerCase(),
      phone: phone || undefined,
      subject,
      message,
      status: "unread",
    });

    // Send auto-reply (non-blocking)
    sendContactAutoReply(email.toLowerCase(), name, subject).catch(() => {});

    return {
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    };
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return {
      success: false,
      error: "Failed to send message. Please try again later.",
    };
  }
}
