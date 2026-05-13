/**
 * Central export point for all Zod validation schemas.
 * Import schemas from here for consistent validation across the app.
 */

export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from "./auth";

export {
  celebritySchema,
  type CelebrityInput,
  type AvailableServiceInput,
  type ConcertDetailsInput,
  type TicketTierInput,
} from "./celebrity";

export {
  bookingRequestSchema,
  paymentUploadSchema,
  bookingReviewSchema,
  bookingStatusUpdateSchema,
  type BookingRequestInput,
  type PaymentUploadInput,
  type BookingReviewInput,
  type BookingStatusUpdateInput,
} from "./booking";

export {
  paymentMethodSchema,
  cryptoDetailsSchema,
  bankTransferDetailsSchema,
  paypalDetailsSchema,
  type PaymentMethodInput,
  type CryptoDetailsInput,
  type BankTransferDetailsInput,
  type PaypalDetailsInput,
} from "./payment-method";

export {
  contactSchema,
  contactReplySchema,
  contactStatusSchema,
  type ContactInput,
  type ContactReplyInput,
  type ContactStatusInput,
} from "./contact";

export {
  siteSettingsSchema,
  adminProfileSchema,
  createAdminSchema,
  type SiteSettingsInput,
  type AdminProfileInput,
  type CreateAdminInput,
} from "./settings";

export {
  updateProfileSchema,
  adminUpdateUserSchema,
  userSearchSchema,
  avatarUploadSchema,
  type UpdateProfileInput,
  type AdminUpdateUserInput,
  type UserSearchInput,
  type AvatarUploadInput,
} from "./user";

export {
  fanCardSchema,
  fanCardOrderSchema,
  fanCardOrderStatusSchema,
  fanCardPaymentUploadSchema,
  type FanCardInput,
  type FanCardOrderInput,
  type FanCardOrderStatusInput,
  type FanCardPaymentUploadInput,
} from "./fan-card";

export {
  membershipTierSchema,
  membershipApplicationSchema,
  membershipStatusSchema,
  membershipPaymentUploadSchema,
  type MembershipTierInput,
  type MembershipApplicationInput,
  type MembershipStatusInput,
  type MembershipPaymentUploadInput,
} from "./membership";
