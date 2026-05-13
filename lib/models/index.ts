/**
 * Central export point for all Mongoose models.
 * Import models from here to ensure consistent model registration.
 */

export { Admin, type IAdmin, type AdminRole } from "./Admin";
export { User, type IUser, type UserStatus, type UserGender } from "./User";
export {
  Celebrity,
  type ICelebrity,
  type CelebrityService,
  type TicketTier,
  type ConcertDetails,
} from "./Celebrity";
export {
  BookingRequest,
  type IBookingRequest,
  type BookingDetails,
} from "./BookingRequest";
export {
  PaymentMethod,
  type IPaymentMethod,
  type PaymentMethodDetails,
} from "./PaymentMethod";
export { SiteSettings, type ISiteSettings } from "./SiteSettings";
export {
  ContactMessage,
  type IContactMessage,
  type ContactMessageStatus,
} from "./ContactMessage";
export { FanCard, type IFanCard } from "./FanCard";
export {
  FanCardOrder,
  type IFanCardOrder,
  type ShippingAddress,
} from "./FanCardOrder";
export { MembershipTier, type IMembershipTier } from "./MembershipTier";
export {
  MembershipApplication,
  type IMembershipApplication,
} from "./MembershipApplication";
