"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2, Stars } from "lucide-react";
import { toast } from "sonner";

import { cn, formatCurrency } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";
import { createBooking } from "@/lib/actions/client/bookings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface AvailableService {
  type: string;
  isActive: boolean;
  basePrice: number;
  description?: string;
  requirements?: string;
}

interface BookingFormProps {
  celebrity: {
    _id: string;
    name: string;
    slug: string;
    profileImage?: { url: string };
    category: string;
    availableServices: AvailableService[];
  };
  preselectedType?: string;
}

export default function BookingForm({ celebrity, preselectedType }: BookingFormProps) {
  const router = useRouter();
  const activeServices = celebrity.availableServices.filter((s) => s.isActive);

  const initialService = preselectedType
    ? activeServices.find((s) => s.type === preselectedType)
    : activeServices[0];

  const [selectedType, setSelectedType] = useState<string>(
    initialService?.type || ""
  );
  const [amount, setAmount] = useState<number>(initialService?.basePrice || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [preferredEndDate, setPreferredEndDate] = useState<Date | undefined>();
  const [preferredCity, setPreferredCity] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [venue, setVenue] = useState("");
  const [guestCount, setGuestCount] = useState<number | "">("");
  const [occasion, setOccasion] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [platform, setPlatform] = useState("");
  const [duration, setDuration] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [campaignDetails, setCampaignDetails] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [message, setMessage] = useState("");

  const selectedService = activeServices.find((s) => s.type === selectedType);
  const serviceInfo = BOOKING_TYPES.find((t) => t.value === selectedType);

  const handleServiceSelect = (type: string) => {
    setSelectedType(type);
    const service = activeServices.find((s) => s.type === type);
    if (service) {
      setAmount(service.basePrice);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedService) {
      toast.error("Please select a service");
      return;
    }

    if (!preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }

    if (preferredDate < new Date()) {
      toast.error("Preferred date must be in the future");
      return;
    }

    if (amount < selectedService.basePrice) {
      toast.error(`Amount must be at least ${formatCurrency(selectedService.basePrice)}`);
      return;
    }

    setIsSubmitting(true);

    const details: Record<string, unknown> = {
      preferredDate: preferredDate.toISOString(),
    };

    if (preferredEndDate) details.preferredEndDate = preferredEndDate.toISOString();
    if (preferredCity) details.preferredCity = preferredCity;
    if (preferredCountry) details.preferredCountry = preferredCountry;
    if (venue) details.venue = venue;
    if (guestCount) details.guestCount = guestCount;
    if (occasion) details.occasion = occasion;
    if (recipientName) details.recipientName = recipientName;
    if (platform) details.platform = platform;
    if (duration) details.duration = duration;
    if (eventName) details.eventName = eventName;
    if (eventType) details.eventType = eventType;
    if (companyName) details.companyName = companyName;
    if (campaignDetails) details.campaignDetails = campaignDetails;
    if (deliverables) details.deliverables = deliverables;

    try {
      const result = await createBooking({
        celebrityId: celebrity._id,
        type: selectedType,
        details,
        amount,
        message: message || undefined,
      });

      if (result.success && result.data) {
        toast.success("Booking submitted successfully!");
        router.push(`/dashboard/bookings/${result.data._id}`);
      } else {
        toast.error(result.error || "Failed to submit booking");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceFields = () => {
    switch (selectedType) {
      case "dinner_date":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred City</Label>
                <Input
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  placeholder="e.g., Los Angeles"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Country</Label>
                <Input
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue Preference</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Fine dining restaurant"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guest Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Number of guests"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Occasion</Label>
                <Input
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="e.g., Birthday, Anniversary"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
          </>
        );

      case "video_call":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#262626]">
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="facetime">FaceTime</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#262626]">
                    <SelectItem value="15min">15 minutes</SelectItem>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="60min">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipient Name (if this is a gift)</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Leave blank if for yourself"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </>
        );

      case "live_performance":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred City</Label>
                <Input
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  placeholder="e.g., New York"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Country</Label>
                <Input
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Madison Square Garden"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Summer Music Festival"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date (for multi-day events)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#0a0a0a] border-[#262626]",
                        !preferredEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {preferredEndDate ? format(preferredEndDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#111111] border-[#262626]">
                    <Calendar
                      mode="single"
                      selected={preferredEndDate}
                      onSelect={setPreferredEndDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Expected Guest Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Number of attendees"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
          </>
        );

      case "private_event":
      case "corporate_event":
        return (
          <>
            {selectedType === "corporate_event" && (
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred City</Label>
                <Input
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  placeholder="e.g., Miami"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Country</Label>
                <Input
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Event venue"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Annual Gala"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Input
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g., Conference, Party"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guest Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Number of guests"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#262626]">
                    <SelectItem value="1hour">1 hour</SelectItem>
                    <SelectItem value="2hours">2 hours</SelectItem>
                    <SelectItem value="3hours">3 hours</SelectItem>
                    <SelectItem value="half_day">Half day</SelectItem>
                    <SelectItem value="full_day">Full day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "charity_event":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred City</Label>
                <Input
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  placeholder="e.g., Chicago"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Country</Label>
                <Input
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Event venue"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Charity Auction"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Attendees</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Number of attendees"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
          </>
        );

      case "photoshoot":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred City</Label>
                <Input
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  placeholder="e.g., Los Angeles"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Country</Label>
                <Input
                  value={preferredCountry}
                  onChange={(e) => setPreferredCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location/Venue</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Studio, Outdoor location"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626]">
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="2hours">2 hours</SelectItem>
                  <SelectItem value="half_day">Half day (4 hours)</SelectItem>
                  <SelectItem value="full_day">Full day (8 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "brand_endorsement":
        return (
          <>
            <div className="space-y-2">
              <Label>Company/Brand Name *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company or brand name"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626]">
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="multiple">Multiple Platforms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campaign Details</Label>
              <Textarea
                value={campaignDetails}
                onChange={(e) => setCampaignDetails(e.target.value)}
                placeholder="Describe your campaign, target audience, goals..."
                rows={3}
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>Deliverables</Label>
              <Textarea
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g., 2 Instagram posts + 1 story, 1 YouTube video"
                rows={2}
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Celebrity Header */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a] shrink-0">
            {celebrity.profileImage?.url ? (
              <Image
                src={celebrity.profileImage.url}
                alt={celebrity.name}
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
            <p className="text-sm text-[#71717A]">Booking for</p>
            <h2 className="font-display text-xl font-semibold text-[#FAFAFA]">
              {celebrity.name}
            </h2>
            <p className="text-sm text-[#A1A1AA]">{celebrity.category}</p>
          </div>
        </div>
      </div>

      {/* Service Selection */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
          Select Service
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeServices.map((service) => {
            const info = BOOKING_TYPES.find((t) => t.value === service.type);
            const Icon = info?.icon;
            const isSelected = selectedType === service.type;

            return (
              <button
                key={service.type}
                type="button"
                onClick={() => handleServiceSelect(service.type)}
                className={cn(
                  "relative p-4 rounded-lg border text-left transition-all",
                  isSelected
                    ? "bg-[#C9A96E]/10 border-[#C9A96E]"
                    : "bg-[#0a0a0a] border-[#262626] hover:border-[#C9A96E]/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-5 h-5 text-[#C9A96E]" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  {Icon && (
                    <div className="p-2 rounded-lg bg-[#C9A96E]/10 shrink-0">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#FAFAFA]">
                      {info?.label || service.type}
                    </p>
                    <p className="text-sm text-[#71717A] line-clamp-2 mt-1">
                      {service.description || info?.description}
                    </p>
                    <p className="text-lg font-semibold text-[#C9A96E] mt-2">
                      {formatCurrency(service.basePrice)}
                    </p>
                    {service.requirements && (
                      <p className="text-xs text-[#71717A] mt-1">
                        Requirements: {service.requirements}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Details */}
      {selectedType && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
            Booking Details
          </h3>
          <div className="space-y-4">
            {/* Preferred Date - Always shown */}
            <div className="space-y-2">
              <Label>Preferred Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[#0a0a0a] border-[#262626]",
                      !preferredDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {preferredDate ? format(preferredDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#111111] border-[#262626]">
                  <Calendar
                    mode="single"
                    selected={preferredDate}
                    onSelect={setPreferredDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Dynamic fields based on service type */}
            {renderServiceFields()}

            {/* Message - Always shown */}
            <div className="space-y-2">
              <Label>Message / Special Requests</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any additional information or special requests..."
                rows={4}
                maxLength={2000}
                className="bg-[#0a0a0a] border-[#262626]"
              />
              <p className="text-xs text-[#71717A] text-right">
                {message.length}/2000
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min={selectedService?.basePrice || 0}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="bg-[#0a0a0a] border-[#262626]"
              />
              <p className="text-xs text-[#71717A]">
                Minimum: {formatCurrency(selectedService?.basePrice || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review & Submit */}
      {selectedType && preferredDate && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
            Review & Submit
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Celebrity</span>
              <span className="text-[#FAFAFA]">{celebrity.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Service</span>
              <span className="text-[#FAFAFA]">{serviceInfo?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#71717A]">Preferred Date</span>
              <span className="text-[#FAFAFA]">{format(preferredDate, "PPP")}</span>
            </div>
            <Separator className="bg-[#262626]" />
            <div className="flex justify-between">
              <span className="text-[#71717A]">Total Amount</span>
              <span className="text-xl font-semibold text-[#C9A96E]">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          <p className="text-sm text-[#71717A] mb-4">
            Your booking will be reviewed by our team. You will be notified once
            it&apos;s approved.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Booking Request"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
