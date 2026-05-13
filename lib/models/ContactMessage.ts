import mongoose, { Schema, Document, Model } from "mongoose";

/** Contact message status types */
export type ContactMessageStatus = "unread" | "read" | "replied" | "archived";

/** Contact message document interface */
export interface IContactMessage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  adminReply?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Contact message schema definition */
const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
    },
    adminReply: {
      type: String,
    },
    repliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
ContactMessageSchema.index({ status: 1 });
ContactMessageSchema.index({ createdAt: -1 });

/** Ensure virtuals are included in JSON output */
ContactMessageSchema.set("toJSON", { virtuals: true });
ContactMessageSchema.set("toObject", { virtuals: true });

/** ContactMessage model - uses existing model if available (for hot reloading) */
export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessage;
