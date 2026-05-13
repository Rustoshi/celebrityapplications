"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Camera, Loader2, Trash2, User, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { cn, formatCurrency } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
  removeAvatar,
} from "@/lib/actions/client/profile";

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

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface ProfileClientProps {
  profile: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: CloudinaryImage;
    dateOfBirth?: string;
    gender?: string;
    country?: string;
    city?: string;
    address?: string;
    bio?: string;
    company?: string;
    totalBookings: number;
    totalSpent: number;
    createdAt: string;
  };
}

export default function ProfileClient({ profile: initialProfile }: ProfileClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined
  );
  const [gender, setGender] = useState(profile.gender || "");
  const [country, setCountry] = useState(profile.country || "");
  const [city, setCity] = useState(profile.city || "");
  const [address, setAddress] = useState(profile.address || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [company, setCompany] = useState(profile.company || "");

  const isDirty =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    phone !== (profile.phone || "") ||
    (dateOfBirth?.toISOString() || "") !== (profile.dateOfBirth || "") ||
    gender !== (profile.gender || "") ||
    country !== (profile.country || "") ||
    city !== (profile.city || "") ||
    address !== (profile.address || "") ||
    bio !== (profile.bio || "") ||
    company !== (profile.company || "");

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadToCloudinary(file, "avatars");
      const result = await updateAvatar({ url: uploaded.url, publicId: uploaded.publicId });

      if (result.success && result.data) {
        setProfile((prev) => ({ ...prev, avatar: result.data!.avatar }));
        toast.success("Avatar updated successfully");
      } else {
        toast.error(result.error || "Failed to update avatar");
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const result = await removeAvatar();
      if (result.success) {
        setProfile((prev) => ({ ...prev, avatar: undefined }));
        toast.success("Avatar removed");
      } else {
        toast.error(result.error || "Failed to remove avatar");
      }
    } catch {
      toast.error("Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth?.toISOString(),
        gender: gender || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
        company: company.trim() || undefined,
      });

      if (result.success && result.data) {
        setProfile((prev) => ({
          ...prev,
          firstName: result.data!.firstName,
          lastName: result.data!.lastName,
          phone: result.data!.phone,
          dateOfBirth: result.data!.dateOfBirth,
          gender: result.data!.gender,
          country: result.data!.country,
          city: result.data!.city,
          address: result.data!.address,
          bio: result.data!.bio,
          company: result.data!.company,
        }));
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
          My Profile
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-[#262626]">
              {profile.avatar?.url ? (
                <Image
                  src={profile.avatar.url}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-[#71717A]" />
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#C9A96E] animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 px-3 bg-[#111111] border-[#262626] hover:bg-[#1a1a1a]"
              >
                <Camera className="w-3 h-3 mr-1" />
                Change
              </Button>
              {profile.avatar && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="h-8 px-2 bg-[#111111] border-[#262626] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="font-display text-2xl font-semibold text-[#FAFAFA]">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-[#A1A1AA]">{profile.email}</p>
            <p className="text-sm text-[#71717A] mt-1">
              Member since {format(new Date(profile.createdAt), "MMMM yyyy")}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold text-[#C9A96E]">
                  {profile.totalBookings}
                </p>
                <p className="text-xs text-[#71717A]">Total Bookings</p>
              </div>
              <Separator orientation="vertical" className="h-10 bg-[#262626]" />
              <div>
                <p className="text-2xl font-bold text-[#C9A96E]">
                  {formatCurrency(profile.totalSpent)}
                </p>
                <p className="text-xs text-[#71717A]">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-6">
          Personal Information
        </h3>

        <div className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[#0a0a0a] border-[#262626]",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#111111] border-[#262626]">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626]">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-[#262626]" />

          <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
            Location
          </h3>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United States"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Los Angeles"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Suite 100"
              rows={2}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>

          <Separator className="bg-[#262626]" />

          <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
            About
          </h3>

          {/* Bio */}
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell us a bit about yourself..."
              rows={4}
              className="bg-[#0a0a0a] border-[#262626]"
            />
            <p className="text-xs text-[#71717A] text-right">{bio.length}/500</p>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>

          <Separator className="bg-[#262626]" />

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-[#0a0a0a] border-[#262626] opacity-60"
            />
            <p className="text-xs text-[#71717A]">
              Contact support to change your email address
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
