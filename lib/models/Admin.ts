import mongoose, { Schema, Document, Model } from "mongoose";

/** Admin role types */
export type AdminRole = "admin" | "super_admin";

/** Admin document interface */
export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Admin schema definition */
const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    avatar: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/** Virtual for full name */
AdminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/** Ensure virtuals are included in JSON output */
AdminSchema.set("toJSON", { virtuals: true });
AdminSchema.set("toObject", { virtuals: true });

/** Admin model - uses existing model if available (for hot reloading) */
export const Admin: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;
