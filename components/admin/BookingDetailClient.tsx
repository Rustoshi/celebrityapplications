"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Building2,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import { reviewBooking } from "@/lib/actions/admin/bookings";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  country?: string;
  city?: string;
}

interface PopulatedCelebrity {
  _id: string;
  name: string;
  slug: string;
  profileImage?: CloudinaryImage;
  category: string;
  nationality?: string;
}

interface SerializedBookingFull {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  details: BookingDetails;
  paymentMethodUsed?: string;
  paymentMethodType?: string;
  paymentReceipt?: string;
  paymentReceiptPublicId?: string;
  paymentUploadedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  completionNote?: string;
  cancellationReason?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  user: PopulatedUser | null;
  celebrity: PopulatedCelebrity | null;
}

interface BookingDetailClientProps {
  booking: SerializedBookingFull;
}

export default function BookingDetailClient({ booking }: BookingDetailClientProps) {
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const bookingType = BOOKING_TYPES.find((t) => t.value === booking.type);
  const TypeIcon = bookingType?.icon;

  const handleAction = async (action: "approve" | "reject" | "complete" | "cancel" | "confirm") => {
    if (action === "reject" && !showRejectForm) {
      setShowRejectForm(true);
      return;
    }

    if (action === "complete" && !showCompleteForm) {
      setShowCompleteForm(true);
      return;
    }

    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    setCurrentAction(action);

    const data: Record<string, unknown> = { action };
    if (adminNote.trim()) data.adminNote = adminNote;
    if (action === "reject") data.rejectionReason = rejectionReason;
    if (action === "complete" && completionNote.trim()) data.completionNote = completionNote;

    const result = await reviewBooking(booking._id, data);

    if (result.success) {
      toast.success(
        action === "approve"
          ? "Booking approved"
          : action === "reject"
          ? "Booking rejected"
          : action === "complete"
          ? "Booking completed"
          : action === "cancel"
          ? "Booking cancelled"
          : "Booking confirmed"
      );
      router.refresh();
    } else {
      toast.error(result.error || "Action failed");
    }

    setIsProcessing(false);
    setCurrentAction(null);
    setShowRejectForm(false);
    setShowCompleteForm(false);
  };

  const canApproveReject = ["pending", "under_review"].includes(booking.status);
  const canCompleteCancel = ["approved", "confirmed", "in_progress"].includes(booking.status);
  const canConfirmCancel = booking.status === "payment_pending";
  const isFinalStatus = ["completed", "rejected", "cancelled"].includes(booking.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/bookings")}
          className="text-[#A1A1AA] hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-bold text-[#C9A96E]">{booking.bookingId}</h1>
            <StatusBadge status={booking.status} type="booking" />
          </div>
          <p className="text-sm text-[#71717A]">
            Submitted {formatDateTime(booking.submittedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Celebrity Info Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Celebrity</h2>
            {booking.celebrity ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
                  {booking.celebrity.profileImage?.url ? (
                    <Image
                      src={booking.celebrity.profileImage.url}
                      alt={booking.celebrity.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xl text-[#C9A96E]">
                      {booking.celebrity.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#FAFAFA]">
                    {booking.celebrity.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-[#262626] text-[#A1A1AA]">
                      {booking.celebrity.category}
                    </Badge>
                    {booking.celebrity.nationality && (
                      <span className="text-sm text-[#71717A]">
                        {booking.celebrity.nationality}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/admin/celebrities/${booking.celebrity._id}/edit`}>
                  <Button variant="outline" size="sm" className="border-[#262626]">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-[#71717A]">Celebrity data unavailable</p>
            )}
          </div>

          {/* Client Info Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Client</h2>
            {booking.user ? (
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={booking.user.avatar} />
                  <AvatarFallback className="bg-[#0a0a0a] text-[#C9A96E] text-lg">
                    {booking.user.firstName.charAt(0)}
                    {booking.user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold text-[#FAFAFA]">
                    {booking.user.firstName} {booking.user.lastName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {booking.user.email}
                    </span>
                    {booking.user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.user.phone}
                      </span>
                    )}
                  </div>
                  {(booking.user.city || booking.user.country) && (
                    <span className="flex items-center gap-1 text-sm text-[#71717A]">
                      <Globe className="w-3 h-3" />
                      {[booking.user.city, booking.user.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <Link href={`/admin/clients/${booking.user._id}`}>
                  <Button variant="outline" size="sm" className="border-[#262626]">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-[#71717A]">Client data unavailable</p>
            )}
          </div>

          {/* Booking Details Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Booking Details</h2>

            <div className="space-y-4">
              {/* Type and Amount */}
              <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  {TypeIcon && <TypeIcon className="w-5 h-5 text-[#C9A96E]" />}
                  <div>
                    <p className="font-medium text-[#FAFAFA]">{bookingType?.label || booking.type}</p>
                    <p className="text-sm text-[#71717A]">{bookingType?.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#C9A96E]">
                    {formatCurrency(booking.amount)}
                  </p>
                  <p className="text-xs text-[#71717A]">{booking.currency}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {booking.details.preferredDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Preferred Date</p>
                      <p className="text-sm text-[#FAFAFA]">
                        {formatDate(booking.details.preferredDate)}
                      </p>
                    </div>
                  </div>
                )}

                {booking.details.preferredEndDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">End Date</p>
                      <p className="text-sm text-[#FAFAFA]">
                        {formatDate(booking.details.preferredEndDate)}
                      </p>
                    </div>
                  </div>
                )}

                {(booking.details.preferredCity || booking.details.preferredCountry) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Location</p>
                      <p className="text-sm text-[#FAFAFA]">
                        {[booking.details.preferredCity, booking.details.preferredCountry]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {booking.details.venue && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Venue</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.venue}</p>
                    </div>
                  </div>
                )}

                {booking.details.guestCount && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Guest Count</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.guestCount}</p>
                    </div>
                  </div>
                )}

                {booking.details.duration && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Duration</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.duration}</p>
                    </div>
                  </div>
                )}

                {booking.details.eventName && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Event Name</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.eventName}</p>
                    </div>
                  </div>
                )}

                {booking.details.eventType && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Event Type</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.eventType}</p>
                    </div>
                  </div>
                )}

                {booking.details.companyName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Company</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.companyName}</p>
                    </div>
                  </div>
                )}

                {booking.details.occasion && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Occasion</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.occasion}</p>
                    </div>
                  </div>
                )}

                {booking.details.recipientName && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Recipient</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.recipientName}</p>
                    </div>
                  </div>
                )}

                {booking.details.platform && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Platform</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.platform}</p>
                    </div>
                  </div>
                )}

                {booking.details.ticketTier && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Ticket Tier</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.ticketTier}</p>
                    </div>
                  </div>
                )}

                {booking.details.ticketQuantity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A]">Ticket Quantity</p>
                      <p className="text-sm text-[#FAFAFA]">{booking.details.ticketQuantity}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              {booking.details.message && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A] mb-1">Message</p>
                      <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap">
                        {booking.details.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.details.specialRequests && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A] mb-1">Special Requests</p>
                      <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap">
                        {booking.details.specialRequests}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.details.campaignDetails && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A] mb-1">Campaign Details</p>
                      <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap">
                        {booking.details.campaignDetails}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.details.deliverables && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A] mb-1">Deliverables</p>
                      <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap">
                        {booking.details.deliverables}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {booking.details.attendeeNames && booking.details.attendeeNames.length > 0 && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-[#71717A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#71717A] mb-1">Attendee Names</p>
                      <p className="text-sm text-[#FAFAFA]">
                        {booking.details.attendeeNames.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info Card */}
          {(booking.paymentMethodUsed || booking.paymentReceipt) && (
            <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
              <h2 className="text-sm font-medium text-[#71717A] mb-4">Payment Information</h2>
              <div className="space-y-3">
                {booking.paymentMethodUsed && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#71717A]">Payment Method</span>
                    <span className="text-sm text-[#FAFAFA]">{booking.paymentMethodUsed}</span>
                  </div>
                )}
                {booking.paymentMethodType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#71717A]">Method Type</span>
                    <span className="text-sm text-[#FAFAFA]">{booking.paymentMethodType}</span>
                  </div>
                )}
                {booking.paymentUploadedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#71717A]">Uploaded At</span>
                    <span className="text-sm text-[#FAFAFA]">
                      {formatDateTime(booking.paymentUploadedAt)}
                    </span>
                  </div>
                )}
                {booking.paymentReceipt && (
                  <div className="pt-3 border-t border-[#262626]">
                    <p className="text-sm text-[#71717A] mb-2">Payment Receipt</p>
                    <a
                      href={booking.paymentReceipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#C9A96E] hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Timeline */}
        <div className="space-y-6">
          {/* Review Actions Card */}
          {!isFinalStatus && (
            <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
              <h2 className="text-sm font-medium text-[#71717A] mb-4">Review Actions</h2>

              <div className="space-y-4">
                {/* Admin Note (always available) */}
                <div className="space-y-2">
                  <Label htmlFor="adminNote" className="text-sm text-[#A1A1AA]">
                    Admin Note (optional)
                  </Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={2}
                    className="bg-[#0a0a0a] border-[#262626] resize-none"
                  />
                </div>

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="space-y-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <Label htmlFor="rejectionReason" className="text-sm text-red-400">
                      Rejection Reason (required)
                    </Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this booking is being rejected..."
                      rows={3}
                      className="bg-[#0a0a0a] border-red-500/30 resize-none"
                    />
                  </div>
                )}

                {/* Complete Form */}
                {showCompleteForm && (
                  <div className="space-y-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <Label htmlFor="completionNote" className="text-sm text-green-400">
                      Completion Note (optional)
                    </Label>
                    <Textarea
                      id="completionNote"
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Add any notes about the completed booking..."
                      rows={3}
                      className="bg-[#0a0a0a] border-green-500/30 resize-none"
                    />
                  </div>
                )}

                <Separator className="bg-[#262626]" />

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canApproveReject && (
                    <>
                      <Button
                        onClick={() => handleAction("approve")}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing && currentAction === "approve" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Approve Booking
                      </Button>
                      <Button
                        onClick={() => handleAction("reject")}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        {isProcessing && currentAction === "reject" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {showRejectForm ? "Confirm Rejection" : "Reject Booking"}
                      </Button>
                      {showRejectForm && (
                        <Button
                          onClick={() => setShowRejectForm(false)}
                          variant="ghost"
                          className="w-full text-[#71717A]"
                        >
                          Cancel
                        </Button>
                      )}
                    </>
                  )}

                  {canConfirmCancel && (
                    <>
                      <Button
                        onClick={() => handleAction("approve")}
                        disabled={isProcessing}
                        className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                      >
                        {isProcessing && currentAction === "approve" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Confirm Payment
                      </Button>
                      <Button
                        onClick={() => handleAction("cancel")}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full border-[#262626] text-[#A1A1AA]"
                      >
                        {isProcessing && currentAction === "cancel" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Cancel Booking
                      </Button>
                    </>
                  )}

                  {canCompleteCancel && (
                    <>
                      <Button
                        onClick={() => handleAction("complete")}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing && currentAction === "complete" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        {showCompleteForm ? "Confirm Completion" : "Mark as Completed"}
                      </Button>
                      {showCompleteForm && (
                        <Button
                          onClick={() => setShowCompleteForm(false)}
                          variant="ghost"
                          className="w-full text-[#71717A]"
                        >
                          Cancel
                        </Button>
                      )}
                      {!showCompleteForm && (
                        <Button
                          onClick={() => handleAction("cancel")}
                          disabled={isProcessing}
                          variant="outline"
                          className="w-full border-[#262626] text-[#A1A1AA]"
                        >
                          {isProcessing && currentAction === "cancel" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Cancel Booking
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
            <h2 className="text-sm font-medium text-[#71717A] mb-4">Timeline</h2>
            <div className="space-y-4">
              <TimelineItem
                icon={<Calendar className="w-4 h-4" />}
                label="Submitted"
                date={booking.submittedAt}
              />

              {booking.reviewedAt && (
                <TimelineItem
                  icon={<AlertCircle className="w-4 h-4" />}
                  label="Reviewed"
                  date={booking.reviewedAt}
                  description={booking.reviewedBy ? `By admin` : undefined}
                />
              )}

              {booking.approvedAt && (
                <TimelineItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                  label="Approved"
                  date={booking.approvedAt}
                />
              )}

              {booking.rejectedAt && (
                <TimelineItem
                  icon={<XCircle className="w-4 h-4 text-red-500" />}
                  label="Rejected"
                  date={booking.rejectedAt}
                />
              )}

              {booking.paymentUploadedAt && (
                <TimelineItem
                  icon={<CreditCard className="w-4 h-4 text-[#C9A96E]" />}
                  label="Payment Uploaded"
                  date={booking.paymentUploadedAt}
                />
              )}

              {booking.completedAt && (
                <TimelineItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                  label="Completed"
                  date={booking.completedAt}
                />
              )}

              {booking.cancelledAt && (
                <TimelineItem
                  icon={<XCircle className="w-4 h-4 text-[#71717A]" />}
                  label="Cancelled"
                  date={booking.cancelledAt}
                />
              )}
            </div>
          </div>

          {/* Admin Notes Card */}
          {(booking.adminNote || booking.rejectionReason || booking.completionNote || booking.cancellationReason) && (
            <div className="bg-[#111111] border border-[#262626] rounded-lg p-6">
              <h2 className="text-sm font-medium text-[#71717A] mb-4">Notes</h2>
              <div className="space-y-4">
                {booking.adminNote && (
                  <div>
                    <p className="text-xs text-[#71717A] mb-1">Admin Note</p>
                    <p className="text-sm text-[#FAFAFA]">{booking.adminNote}</p>
                  </div>
                )}
                {booking.rejectionReason && (
                  <div>
                    <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-[#FAFAFA]">{booking.rejectionReason}</p>
                  </div>
                )}
                {booking.completionNote && (
                  <div>
                    <p className="text-xs text-green-400 mb-1">Completion Note</p>
                    <p className="text-sm text-[#FAFAFA]">{booking.completionNote}</p>
                  </div>
                )}
                {booking.cancellationReason && (
                  <div>
                    <p className="text-xs text-[#71717A] mb-1">Cancellation Reason</p>
                    <p className="text-sm text-[#FAFAFA]">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#262626] flex items-center justify-center text-[#A1A1AA]">
        {icon}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium text-[#FAFAFA]">{label}</p>
        <p className="text-xs text-[#71717A]">{formatDateTime(date)}</p>
        {description && <p className="text-xs text-[#71717A] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
