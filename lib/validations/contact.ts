import { z } from "zod";

/** Contact form validation schema */
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject cannot exceed 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message cannot exceed 5000 characters"),
});

/** Inferred type for contact form input */
export type ContactInput = z.infer<typeof contactSchema>;

/** Admin reply to contact message schema */
export const contactReplySchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  reply: z
    .string()
    .min(10, "Reply must be at least 10 characters")
    .max(5000, "Reply cannot exceed 5000 characters"),
});

/** Inferred type for contact reply input */
export type ContactReplyInput = z.infer<typeof contactReplySchema>;

/** Contact message status update schema */
export const contactStatusSchema = z.object({
  status: z.enum(["unread", "read", "replied", "archived"], {
    message: "Please select a valid status",
  }),
});

/** Inferred type for contact status update input */
export type ContactStatusInput = z.infer<typeof contactStatusSchema>;
