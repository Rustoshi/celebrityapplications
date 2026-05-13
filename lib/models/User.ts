import mongoose, { Schema, Document, Model } from "mongoose";

/** User status types */
export type UserStatus = "active" | "suspended" | "pending";

/** User gender types */
export type UserGender = "male" | "female" | "other" | "prefer_not_to_say";

/** Cloudinary image type */
export interface CloudinaryImage {
  url: string;
  publicId: string;
}

/** User document interface - represents clients who book celebrities */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: CloudinaryImage;
  dateOfBirth?: Date;
  gender?: UserGender;
  country?: string;
  city?: string;
  address?: string;
  bio?: string;
  company?: string;
  status: UserStatus;
  emailVerified: boolean;
  totalBookings: number;
  totalSpent: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

/** User schema definition */
const UserSchema = new Schema<IUser>(
  {
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
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: {
        url: String,
        publicId: String,
      },
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    address: {
      type: String,
    },
    bio: {
      type: String,
    },
    company: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/** Indexes for efficient queries */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

/** Virtual for full name */
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

/** Ensure virtuals are included in JSON output */
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

/** User model - uses existing model if available (for hot reloading) */
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
