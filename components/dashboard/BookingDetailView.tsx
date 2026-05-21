"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Upload,
  Loader2,
  CreditCard,
  Building2,
  Wallet,
  Bitcoin,
  Gift,
  AlertCircle,
  Stars,
  Calendar,
  MapPin,
  Users,
  Briefcase,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import { BOOKING_TYPES, GIFT_CARD_TYPES } from "@/lib/constants";
import { uploadPaymentReceipt, cancelBooking } from "@/lib/actions/client/bookings";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/admin/StatusBadge";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface BookingDetails {
  preferredDate?: string;
  preferredEndDate?: string;
  preferredCity?: string;
  preferredCountry?: string;
  venue?: string;
  specialRequests?: string;
  message?: string;
  guestCount?: number;
  eventType?: string;
  eventName?: string;
  duration?: string;
  companyName?: string;
  ticketTier?: string;
  ticketQuantity?: number;
  attendeeNames?: string[];
  occasion?: string;
  recipientName?: string;
  platform?: string;
  campaignDetails?: string;
  deliverables?: string;
}

interface SerializedFullClientBooking {
  _id: string;
  bookingId: string;
  userId: string;
  celebrityId: string;
  type: string;
  status: string;
  details: BookingDetails;
  amount: number;
  currency: string;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: string;
  giftCardType?: string;
  giftCardAmount?: number;
  giftCardCode?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  completionNote?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  celebrity?: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: CloudinaryImage;
    coverImage?: CloudinaryImage;
    category: string;
    nationality?: string;
  };
}

interface SerializedPaymentMethod {
  _id: string;
  type: string;
  label: string;
  instructions?: string;
  details: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
}

interface BookingDetailViewProps {
  booking: SerializedFullClientBooking;
  paymentMethods: SerializedPaymentMethod[];
}

const paymentTypeIcons: Record<string, React.ElementType> = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_transfer: Building2,
  wire_transfer: Building2,
  paypal: Wallet,
  crypto: Bitcoin,
  gift_card: Gift,
};

export default function BookingDetailView({
  booking,
  paymentMethods,
}: BookingDetailViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Gift card specific state
  const [giftCardType, setGiftCardType] = useState<string>("");
  const [giftCardAmount, setGiftCardAmount] = useState<string>("");
  const [giftCardCode, setGiftCardCode] = useState<string>("");

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const serviceInfo = BOOKING_TYPES.find((t) => t.value === booking.type);
  const Icon = serviceInfo?.icon;

  const canUploadPayment = ["approved", "payment_pending"].includes(booking.status);
  const canCancel = ["pending", "under_review", "approved", "payment_pending"].includes(
    booking.status
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an image (JPEG, PNG, WebP) or PDF");
      return;
    }

    setReceiptFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleUploadReceipt = async () => {
    const method = paymentMethods.find((m) => m._id === selectedMethod);
    if (!method) {
      toast.error("Please select a payment method");
      return;
    }

    // Validate gift card specific fields
    if (method.type === "gift_card") {
      if (!giftCardType) {
        toast.error("Please select a gift card type");
        return;
      }
      if (!giftCardAmount || parseFloat(giftCardAmount) <= 0) {
        toast.error("Please enter a valid gift card amount");
        return;
      }
      if (!receiptFile && !giftCardCode) {
        toast.error("Please upload a gift card image or enter the e-code");
        return;
      }
    } else if (!receiptFile) {
      toast.error("Please upload a payment receipt");
      return;
    }

    setIsUploading(true);

    try {
      let uploaded: { url: string; publicId: string } | null = null;
      
      if (receiptFile) {
        uploaded = await uploadToCloudinary(receiptFile, "receipts");
      }

      const giftCardDetails = method.type === "gift_card" ? {
        giftCardType,
        giftCardAmount: parseFloat(giftCardAmount),
        giftCardCode: giftCardCode || undefined,
      } : undefined;

      const result = await uploadPaymentReceipt(
        booking._id,
        uploaded,
        method.label,
        method.type,
        giftCardDetails
      );

      if (result.success) {
        toast.success("Payment submitted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit payment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelBooking(booking._id, cancelReason || undefined);

      if (result.success) {
        toast.success("Booking cancelled successfully");
        setCancelDialogOpen(false);
        router.push("/dashboard/bookings");
      } else {
        toast.error(result.error || "Failed to cancel booking");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCancelling(false);
    }
  };

  const renderDetailItem = (label: string, value: string | number | undefined) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-2">
        <span className="text-[#71717A]">{label}</span>
        <span className="text-[#FAFAFA] text-right">{value}</span>
      </div>
    );
  };

  const renderPaymentMethodDetails = (method: SerializedPaymentMethod) => {
    const details = method.details as Record<string, string | undefined>;

    switch (method.type) {
      case "crypto":
        return (
          <div className="mt-2 space-y-1 text-sm">
            {details.walletAddress ? (
              <p className="text-[#A1A1AA] break-all">
                <span className="text-[#71717A]">Address: </span>
                {details.walletAddress}
              </p>
            ) : null}
            {details.network ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Network: </span>
                {details.network}
              </p>
            ) : null}
          </div>
        );

      case "bank_transfer":
      case "wire_transfer":
        return (
          <div className="mt-2 space-y-1 text-sm">
            {details.bankName ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Bank: </span>
                {details.bankName}
              </p>
            ) : null}
            {details.accountName ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Account Name: </span>
                {details.accountName}
              </p>
            ) : null}
            {details.accountNumber ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Account #: </span>
                {details.accountNumber}
              </p>
            ) : null}
            {details.routingNumber ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Routing #: </span>
                {details.routingNumber}
              </p>
            ) : null}
          </div>
        );

      case "paypal":
        return (
          <div className="mt-2 space-y-1 text-sm">
            {details.email ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Email: </span>
                {details.email}
              </p>
            ) : null}
            {details.paypalLink ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">PayPal.me: </span>
                {details.paypalLink}
              </p>
            ) : null}
          </div>
        );

      case "gift_card": {
        const acceptedCards = details.acceptedGiftCards as unknown as string[] | undefined;
        return (
          <div className="mt-2 space-y-1 text-sm">
            {acceptedCards?.length ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Accepted: </span>
                {acceptedCards.join(", ")}
              </p>
            ) : null}
            {details.giftCardInstructions ? (
              <p className="text-[#A1A1AA]">
                <span className="text-[#71717A]">Instructions: </span>
                {details.giftCardInstructions}
              </p>
            ) : null}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Bookings
      </Link>

      {/* Header */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-[#71717A]">Booking ID</p>
            <h1 className="font-display text-2xl font-bold text-[#C9A96E]">
              {booking.bookingId}
            </h1>
          </div>
          <StatusBadge status={booking.status} type="booking" />
        </div>
      </div>

      {/* Celebrity Card */}
      {booking.celebrity && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <Link
            href={`/dashboard/celebrities/${booking.celebrity.slug}`}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a] shrink-0">
              {booking.celebrity.profileImage?.url ? (
                <Image
                  src={booking.celebrity.profileImage.url}
                  alt={booking.celebrity.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Stars className="w-6 h-6 text-[#71717A]" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
                {booking.celebrity.name}
              </h2>
              <p className="text-sm text-[#A1A1AA]">{booking.celebrity.category}</p>
              {booking.celebrity.nationality && (
                <p className="text-xs text-[#71717A]">
                  {booking.celebrity.nationality}
                </p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Booking Info */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
          Booking Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-[#C9A96E]/10">
                <Icon className="w-5 h-5 text-[#C9A96E]" />
              </div>
            )}
            <div>
              <p className="font-medium text-[#FAFAFA]">
                {serviceInfo?.label || booking.type}
              </p>
              <p className="text-sm text-[#71717A]">Service Type</p>
            </div>
          </div>
          <Separator className="bg-[#262626]" />
          <div className="flex justify-between items-center">
            <span className="text-[#71717A]">Amount</span>
            <span className="text-2xl font-bold text-[#C9A96E]">
              {formatCurrency(booking.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Currency</span>
            <span className="text-[#FAFAFA]">{booking.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Submitted</span>
            <span className="text-[#FAFAFA]">
              {formatDateTime(booking.submittedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
          Booking Details
        </h3>
        <div className="divide-y divide-[#262626]">
          {booking.details.preferredDate &&
            renderDetailItem(
              "Preferred Date",
              formatDate(booking.details.preferredDate)
            )}
          {booking.details.preferredEndDate &&
            renderDetailItem(
              "End Date",
              formatDate(booking.details.preferredEndDate)
            )}
          {booking.details.preferredCity &&
            renderDetailItem("City", booking.details.preferredCity)}
          {booking.details.preferredCountry &&
            renderDetailItem("Country", booking.details.preferredCountry)}
          {booking.details.venue && renderDetailItem("Venue", booking.details.venue)}
          {booking.details.guestCount &&
            renderDetailItem("Guest Count", booking.details.guestCount)}
          {booking.details.eventName &&
            renderDetailItem("Event Name", booking.details.eventName)}
          {booking.details.eventType &&
            renderDetailItem("Event Type", booking.details.eventType)}
          {booking.details.duration &&
            renderDetailItem("Duration", booking.details.duration)}
          {booking.details.companyName &&
            renderDetailItem("Company", booking.details.companyName)}
          {booking.details.occasion &&
            renderDetailItem("Occasion", booking.details.occasion)}
          {booking.details.recipientName &&
            renderDetailItem("Recipient", booking.details.recipientName)}
          {booking.details.platform &&
            renderDetailItem("Platform", booking.details.platform)}
          {booking.details.campaignDetails && (
            <div className="py-2">
              <p className="text-[#71717A] mb-1">Campaign Details</p>
              <p className="text-[#FAFAFA] whitespace-pre-wrap">
                {booking.details.campaignDetails}
              </p>
            </div>
          )}
          {booking.details.deliverables && (
            <div className="py-2">
              <p className="text-[#71717A] mb-1">Deliverables</p>
              <p className="text-[#FAFAFA] whitespace-pre-wrap">
                {booking.details.deliverables}
              </p>
            </div>
          )}
          {booking.details.message && (
            <div className="py-2">
              <p className="text-[#71717A] mb-1">Message / Special Requests</p>
              <p className="text-[#FAFAFA] whitespace-pre-wrap">
                {booking.details.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
          Status Timeline
        </h3>
        <div className="space-y-4">
          {/* Submitted */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#C9A96E]" />
              </div>
              <div className="w-px h-full bg-[#262626] mt-2" />
            </div>
            <div className="pb-4">
              <p className="font-medium text-[#FAFAFA]">Submitted</p>
              <p className="text-sm text-[#71717A]">
                {formatDateTime(booking.submittedAt)}
              </p>
            </div>
          </div>

          {/* Approved */}
          {booking.approvedAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <div className="w-px h-full bg-[#262626] mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-[#FAFAFA]">Approved</p>
                <p className="text-sm text-[#71717A]">
                  {formatDateTime(booking.approvedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Rejected */}
          {booking.rejectedAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-[#FAFAFA]">Rejected</p>
                <p className="text-sm text-[#71717A]">
                  {formatDateTime(booking.rejectedAt)}
                </p>
                {booking.rejectionReason && (
                  <p className="text-sm text-red-400 mt-1">
                    Reason: {booking.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Uploaded */}
          {booking.paymentUploadedAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-blue-400" />
                </div>
                <div className="w-px h-full bg-[#262626] mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-[#FAFAFA]">Payment Uploaded</p>
                <p className="text-sm text-[#71717A]">
                  {formatDateTime(booking.paymentUploadedAt)}
                </p>
                {booking.paymentMethodUsed && (
                  <p className="text-sm text-[#A1A1AA]">
                    via {booking.paymentMethodUsed}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Completed */}
          {booking.completedAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-[#FAFAFA]">Completed</p>
                <p className="text-sm text-[#71717A]">
                  {formatDateTime(booking.completedAt)}
                </p>
                {booking.completionNote && (
                  <p className="text-sm text-[#A1A1AA] mt-1">
                    {booking.completionNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cancelled */}
          {booking.cancelledAt && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-[#FAFAFA]">Cancelled</p>
                <p className="text-sm text-[#71717A]">
                  {formatDateTime(booking.cancelledAt)}
                </p>
                {booking.cancellationReason && (
                  <p className="text-sm text-red-400 mt-1">
                    Reason: {booking.cancellationReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending indicator */}
          {!booking.completedAt &&
            !booking.rejectedAt &&
            !booking.cancelledAt && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#71717A]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#71717A]">In Progress</p>
                  <p className="text-sm text-[#71717A]">
                    Awaiting next steps...
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Admin Note */}
        {booking.adminNote && (
          <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
            <p className="text-sm text-[#71717A] mb-1">Admin Note</p>
            <p className="text-[#FAFAFA]">{booking.adminNote}</p>
          </div>
        )}
      </div>

      {/* Payment Section */}
      {canUploadPayment && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
            Payment
          </h3>

          {booking.paymentReceipt ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Payment Receipt Uploaded</span>
                </div>
                <p className="text-sm text-[#A1A1AA]">
                  Uploaded on {formatDateTime(booking.paymentUploadedAt || "")} via{" "}
                  {booking.paymentMethodUsed}
                </p>
              </div>

              {booking.paymentReceipt.match(/\.(jpg|jpeg|png|webp|gif)$/i) && (
                <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-[#0a0a0a]">
                  <Image
                    src={booking.paymentReceipt}
                    alt="Payment receipt"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <p className="text-sm text-[#71717A]">
                Awaiting admin confirmation. You can upload a new receipt if needed.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-[#C9A96E] mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Payment Required</span>
              </div>
              <p className="text-sm text-[#A1A1AA]">
                Your booking has been approved. Please complete the payment and
                upload your receipt.
              </p>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-4 mt-6">
            <p className="text-sm font-medium text-[#FAFAFA]">
              Select Payment Method
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const MethodIcon = paymentTypeIcons[method.type] || CreditCard;
                const isSelected = selectedMethod === method._id;

                return (
                  <button
                    key={method._id}
                    type="button"
                    onClick={() => setSelectedMethod(method._id)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      isSelected
                        ? "bg-[#C9A96E]/10 border-[#C9A96E]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-[#C9A96E]/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <MethodIcon className="w-5 h-5 text-[#C9A96E]" />
                      <span className="font-medium text-[#FAFAFA]">
                        {method.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#C9A96E] ml-auto" />
                      )}
                    </div>
                    {method.instructions && (
                      <p className="text-sm text-[#71717A]">{method.instructions}</p>
                    )}
                    {renderPaymentMethodDetails(method)}
                  </button>
                );
              })}
            </div>

            {/* Upload Receipt / Gift Card Details */}
            {selectedMethod && (() => {
              const method = paymentMethods.find((m) => m._id === selectedMethod);
              const isGiftCard = method?.type === "gift_card";

              return (
                <div className="space-y-4 pt-4 border-t border-[#262626]">
                  {isGiftCard ? (
                    <>
                      <p className="text-sm font-medium text-[#FAFAFA]">
                        Gift Card Details
                      </p>

                      {/* Gift Card Type */}
                      <div className="space-y-2">
                        <Label className="text-[#A1A1AA]">Gift Card Type *</Label>
                        <Select value={giftCardType} onValueChange={setGiftCardType}>
                          <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                            <SelectValue placeholder="Select gift card type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111111] border-[#262626]">
                            {GIFT_CARD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gift Card Amount */}
                      <div className="space-y-2">
                        <Label className="text-[#A1A1AA]">Gift Card Amount (USD) *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={giftCardAmount}
                          onChange={(e) => setGiftCardAmount(e.target.value)}
                          placeholder="Enter gift card value"
                          className="bg-[#0a0a0a] border-[#262626]"
                        />
                      </div>

                      {/* Gift Card E-Code */}
                      <div className="space-y-2">
                        <Label className="text-[#A1A1AA]">
                          E-Code / Redemption Code (if digital)
                        </Label>
                        <Input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          placeholder="Enter gift card code"
                          className="bg-[#0a0a0a] border-[#262626] font-mono"
                        />
                        <p className="text-xs text-[#71717A]">
                          Enter the code if it&apos;s a digital gift card, or upload an image below
                        </p>
                      </div>

                      {/* Gift Card Image Upload */}
                      <div className="space-y-2">
                        <Label className="text-[#A1A1AA]">
                          Gift Card Image (scratched but unused)
                        </Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {receiptPreview ? (
                          <div className="space-y-3">
                            <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-[#0a0a0a]">
                              <Image
                                src={receiptPreview}
                                alt="Gift card preview"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="border-[#262626]"
                            >
                              Change Image
                            </Button>
                          </div>
                        ) : receiptFile ? (
                          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                            <FileText className="w-5 h-5 text-[#C9A96E]" />
                            <span className="text-[#FAFAFA]">{receiptFile.name}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="ml-auto border-[#262626]"
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-20 border-dashed border-[#262626] hover:border-[#C9A96E]/50"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Gift className="w-5 h-5 text-[#71717A]" />
                              <span className="text-[#71717A] text-sm">
                                Upload gift card image (optional if code provided)
                              </span>
                            </div>
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[#FAFAFA]">
                        Upload Payment Receipt
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {receiptPreview ? (
                        <div className="space-y-3">
                          <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-[#0a0a0a]">
                            <Image
                              src={receiptPreview}
                              alt="Receipt preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-[#262626]"
                          >
                            Change File
                          </Button>
                        </div>
                      ) : receiptFile ? (
                        <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
                          <FileText className="w-5 h-5 text-[#C9A96E]" />
                          <span className="text-[#FAFAFA]">{receiptFile.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="ml-auto border-[#262626]"
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-24 border-dashed border-[#262626] hover:border-[#C9A96E]/50"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-[#71717A]" />
                            <span className="text-[#71717A]">
                              Click to upload receipt (max 10MB)
                            </span>
                          </div>
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    onClick={handleUploadReceipt}
                    disabled={isUploading || (isGiftCard ? (!giftCardType || !giftCardAmount || (!receiptFile && !giftCardCode)) : !receiptFile)}
                    className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : isGiftCard ? (
                      "Submit Gift Card Payment"
                    ) : (
                      "Upload Payment Receipt"
                    )}
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
            Cancel Booking
          </h3>
          <p className="text-sm text-[#71717A] mb-4">
            If you need to cancel this booking, you can do so below. This action
            cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
          >
            Cancel Booking
          </Button>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Cancel Booking</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to cancel this booking? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm text-[#A1A1AA]">
              Reason for cancellation (optional)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let us know why you're cancelling..."
              rows={3}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="border-[#262626]"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
