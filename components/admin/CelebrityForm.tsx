"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
  CalendarIcon,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn, getInitials } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import { CELEBRITY_CATEGORIES, BOOKING_TYPES } from "@/lib/constants";
import { celebritySchema } from "@/lib/validations/celebrity";
import {
  createCelebrity,
  updateCelebrity,
} from "@/lib/actions/admin/celebrities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface AvailableService {
  type: string;
  isActive: boolean;
  basePrice: number;
  description?: string;
  requirements?: string;
}

interface TicketTier {
  name: string;
  price: number;
  totalSlots: number;
  availableSlots: number;
  perks?: string;
}

interface ConcertDetails {
  title: string;
  venue: string;
  date: string;
  city: string;
  country: string;
  description?: string;
  ticketTiers: TicketTier[];
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
}

interface SerializedCelebrityFull {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  shortBio?: string;
  category: string;
  subcategories: string[];
  profileImage?: CloudinaryImage;
  coverImage?: CloudinaryImage;
  nationality?: string;
  knownFor?: string;
  achievements: string[];
  languages: string[];
  socialLinks: SocialLinks;
  availableServices: AvailableService[];
  concertEnabled: boolean;
  concertDetails?: ConcertDetails;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  agencyName?: string;
  internalNotes?: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
}

interface CelebrityFormProps {
  celebrity?: SerializedCelebrityFull;
  isEditing?: boolean;
}

const defaultService: AvailableService = {
  type: "dinner_date",
  isActive: true,
  basePrice: 0,
  description: "",
  requirements: "",
};

const defaultTicketTier: TicketTier = {
  name: "",
  price: 0,
  totalSlots: 0,
  availableSlots: 0,
  perks: "",
};

export default function CelebrityForm({
  celebrity,
  isEditing = false,
}: CelebrityFormProps) {
  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [name, setName] = useState(celebrity?.name || "");
  const [category, setCategory] = useState(celebrity?.category || "");
  const [shortBio, setShortBio] = useState(celebrity?.shortBio || "");
  const [bio, setBio] = useState(celebrity?.bio || "");
  const [nationality, setNationality] = useState(celebrity?.nationality || "");
  const [knownFor, setKnownFor] = useState(celebrity?.knownFor || "");
  const [tags, setTags] = useState(celebrity?.tags?.join(", ") || "");

  // Media state
  const [profileImage, setProfileImage] = useState<CloudinaryImage | null>(
    celebrity?.profileImage || null
  );
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<CloudinaryImage | null>(
    celebrity?.coverImage || null
  );
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  // Services state
  const [services, setServices] = useState<AvailableService[]>(
    celebrity?.availableServices || []
  );

  // Concert state
  const [concertEnabled, setConcertEnabled] = useState(
    celebrity?.concertEnabled || false
  );
  const [concertTitle, setConcertTitle] = useState(
    celebrity?.concertDetails?.title || ""
  );
  const [concertVenue, setConcertVenue] = useState(
    celebrity?.concertDetails?.venue || ""
  );
  const [concertDate, setConcertDate] = useState<Date | undefined>(
    celebrity?.concertDetails?.date
      ? new Date(celebrity.concertDetails.date)
      : undefined
  );
  const [concertCity, setConcertCity] = useState(
    celebrity?.concertDetails?.city || ""
  );
  const [concertCountry, setConcertCountry] = useState(
    celebrity?.concertDetails?.country || ""
  );
  const [concertDescription, setConcertDescription] = useState(
    celebrity?.concertDetails?.description || ""
  );
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(
    celebrity?.concertDetails?.ticketTiers || []
  );

  // Management state
  const [managerName, setManagerName] = useState(celebrity?.managerName || "");
  const [managerEmail, setManagerEmail] = useState(celebrity?.managerEmail || "");
  const [managerPhone, setManagerPhone] = useState(celebrity?.managerPhone || "");
  const [agencyName, setAgencyName] = useState(celebrity?.agencyName || "");
  const [internalNotes, setInternalNotes] = useState(
    celebrity?.internalNotes || ""
  );

  // Settings state
  const [isActive, setIsActive] = useState(celebrity?.isActive ?? true);
  const [featured, setFeatured] = useState(celebrity?.featured || false);
  const [sortOrder, setSortOrder] = useState(celebrity?.sortOrder || 0);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    const preview = URL.createObjectURL(file);
    if (type === "profile") {
      setProfileImageFile(file);
      setProfileImage({ url: preview, publicId: "" });
    } else {
      setCoverImageFile(file);
      setCoverImage({ url: preview, publicId: "" });
    }
  };

  const removeImage = (type: "profile" | "cover") => {
    if (type === "profile") {
      setProfileImage(null);
      setProfileImageFile(null);
      if (profileInputRef.current) profileInputRef.current.value = "";
    } else {
      setCoverImage(null);
      setCoverImageFile(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const addService = () => {
    setServices([...services, { ...defaultService }]);
  };

  const updateService = (
    index: number,
    field: keyof AvailableService,
    value: string | number | boolean
  ) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { ...defaultTicketTier }]);
  };

  const updateTicketTier = (
    index: number,
    field: keyof TicketTier,
    value: string | number
  ) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTiers(updated);
  };

  const removeTicketTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_, i) => i !== index));
  };

  const getTabHasErrors = (tab: string): boolean => {
    const errorKeys = Object.keys(errors);
    if (tab === "basic") {
      return errorKeys.some((k) =>
        ["name", "category", "shortBio", "bio", "nationality", "knownFor", "tags"].includes(k)
      );
    }
    if (tab === "services") {
      return errorKeys.some((k) => k.startsWith("availableServices"));
    }
    if (tab === "concert") {
      return errorKeys.some((k) => k.startsWith("concertDetails"));
    }
    return false;
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    const formData: Record<string, unknown> = {
      name,
      category,
      shortBio: shortBio || undefined,
      bio: bio || undefined,
      nationality: nationality || undefined,
      knownFor: knownFor || undefined,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      subcategories: [],
      achievements: [],
      languages: [],
      socialLinks: {},
      availableServices: services.map((s) => ({
        ...s,
        basePrice: Number(s.basePrice) || 0,
      })),
      concertEnabled,
      managerName: managerName || undefined,
      managerEmail: managerEmail || undefined,
      managerPhone: managerPhone || undefined,
      agencyName: agencyName || undefined,
      internalNotes: internalNotes || undefined,
      isActive,
      featured,
      sortOrder: Number(sortOrder) || 0,
    };

    if (concertEnabled) {
      formData.concertDetails = {
        title: concertTitle,
        venue: concertVenue,
        date: concertDate?.toISOString() || "",
        city: concertCity,
        country: concertCountry,
        description: concertDescription || undefined,
        ticketTiers: ticketTiers.map((t) => ({
          ...t,
          price: Number(t.price) || 0,
          totalSlots: Number(t.totalSlots) || 0,
          availableSlots: Number(t.availableSlots) || Number(t.totalSlots) || 0,
        })),
      };
    }

    const validation = celebritySchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors as Record<string, string[]>);
      const firstError = Object.values(fieldErrors)[0]?.[0];
      toast.error(firstError || "Please check the form for errors");
      setIsSubmitting(false);
      return;
    }

    try {
      let uploadedProfile: { url: string; publicId: string } | undefined;
      let uploadedCover: { url: string; publicId: string } | undefined;

      if (profileImageFile) {
        try {
          uploadedProfile = await uploadToCloudinary(profileImageFile, "celebrities/profiles");
        } catch {
          toast.error("Failed to upload profile image");
          setIsSubmitting(false);
          return;
        }
      }

      if (coverImageFile) {
        try {
          uploadedCover = await uploadToCloudinary(coverImageFile, "celebrities/covers");
        } catch {
          toast.error("Failed to upload cover image");
          setIsSubmitting(false);
          return;
        }
      }

      let result;

      if (isEditing && celebrity) {
        result = await updateCelebrity(
          celebrity._id,
          formData,
          uploadedProfile,
          uploadedCover
        );
      } else {
        result = await createCelebrity(
          formData,
          uploadedProfile,
          uploadedCover
        );
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Celebrity updated successfully"
            : "Celebrity created successfully"
        );
        router.push("/admin/celebrities");
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/celebrities")}
          className="text-[#A1A1AA] hover:text-[#FAFAFA]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
            {isEditing ? "Edit Celebrity" : "Add Celebrity"}
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            {isEditing
              ? "Update celebrity information"
              : "Add a new celebrity to the platform"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626] p-1">
          <TabsTrigger
            value="basic"
            className={cn(
              "data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]",
              getTabHasErrors("basic") && "text-red-400"
            )}
          >
            Basic Info
            {getTabHasErrors("basic") && (
              <AlertCircle className="w-3 h-3 ml-1 text-red-400" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className={cn(
              "data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]",
              getTabHasErrors("services") && "text-red-400"
            )}
          >
            Services
            {getTabHasErrors("services") && (
              <AlertCircle className="w-3 h-3 ml-1 text-red-400" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="concert"
            className={cn(
              "data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]",
              getTabHasErrors("concert") && "text-red-400"
            )}
          >
            Concert
            {getTabHasErrors("concert") && (
              <AlertCircle className="w-3 h-3 ml-1 text-red-400" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]"
          >
            Management
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#FAFAFA]"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Celebrity name"
                  className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111111] border-[#262626]">
                    {CELEBRITY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-400">{errors.category[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shortBio">Short Bio</Label>
                <span className="text-xs text-[#71717A]">
                  {shortBio.length}/300
                </span>
              </div>
              <Textarea
                id="shortBio"
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value.slice(0, 300))}
                placeholder="Brief description (shown on cards)"
                rows={2}
                className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E] resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">Full Bio</Label>
                <span className="text-xs text-[#71717A]">{bio.length}/5000</span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 5000))}
                placeholder="Detailed biography"
                rows={6}
                className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g., American"
                  className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="knownFor">Known For</Label>
                <Input
                  id="knownFor"
                  value={knownFor}
                  onChange={(e) => setKnownFor(e.target.value)}
                  placeholder="e.g., Award-winning actor"
                  className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., hollywood, oscar winner)"
                className="bg-[#0a0a0a] border-[#262626] focus:border-[#C9A96E]"
              />
              <p className="text-xs text-[#71717A]">
                Separate tags with commas
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            {/* Profile Image */}
            <div className="space-y-4">
              <Label>Profile Image</Label>
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-[#0a0a0a] border border-[#262626] flex items-center justify-center">
                  {profileImage?.url ? (
                    <Image
                      src={profileImage.url}
                      alt="Profile preview"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-[#C9A96E]">
                      {name ? getInitials(name) : <ImageIcon className="w-8 h-8 text-[#71717A]" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleImageUpload(e, "profile")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => profileInputRef.current?.click()}
                    className="border-[#262626] hover:bg-[#1a1a1a]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  {profileImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeImage("profile")}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <p className="text-xs text-[#71717A]">
                    JPEG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-4">
              <Label>Cover Image</Label>
              <div className="space-y-3">
                <div className="aspect-[3/1] max-w-xl rounded-lg overflow-hidden bg-[#0a0a0a] border border-[#262626] flex items-center justify-center">
                  {coverImage?.url ? (
                    <Image
                      src={coverImage.url}
                      alt="Cover preview"
                      width={600}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-[#71717A]" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleImageUpload(e, "cover")}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverInputRef.current?.click()}
                    className="border-[#262626] hover:bg-[#1a1a1a]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Cover
                  </Button>
                  {coverImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeImage("cover")}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[#71717A]">
                  Recommended: 1200x400px. JPEG, PNG, or WebP. Max 5MB.
                </p>
              </div>
            </div>

            {/* Gallery Placeholder */}
            <div className="space-y-4">
              <Label>Gallery</Label>
              <div className="p-6 rounded-lg border border-dashed border-[#262626] text-center">
                <ImageIcon className="w-8 h-8 mx-auto text-[#71717A] mb-2" />
                <p className="text-sm text-[#71717A]">
                  Gallery management coming in a future update
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#FAFAFA]">Available Services</h3>
                <p className="text-sm text-[#71717A]">
                  Configure the booking services this celebrity offers
                </p>
              </div>
              <Button
                type="button"
                onClick={addService}
                className="bg-[#C9A96E] text-black hover:bg-[#D4B87A]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            {services.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#262626] rounded-lg">
                <p className="text-[#71717A]">No services added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#A1A1AA]">
                        Service {index + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={service.isActive}
                            onCheckedChange={(checked) =>
                              updateService(index, "isActive", checked)
                            }
                          />
                          <span className="text-xs text-[#71717A]">Active</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeService(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Service Type</Label>
                        <Select
                          value={service.type}
                          onValueChange={(value) =>
                            updateService(index, "type", value)
                          }
                        >
                          <SelectTrigger className="bg-[#111111] border-[#262626]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111111] border-[#262626]">
                            {BOOKING_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Base Price ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={service.basePrice}
                          onChange={(e) =>
                            updateService(index, "basePrice", e.target.value)
                          }
                          className="bg-[#111111] border-[#262626]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={service.description || ""}
                        onChange={(e) =>
                          updateService(index, "description", e.target.value)
                        }
                        placeholder="Optional service description"
                        rows={2}
                        className="bg-[#111111] border-[#262626] resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Requirements</Label>
                      <Textarea
                        value={service.requirements || ""}
                        onChange={(e) =>
                          updateService(index, "requirements", e.target.value)
                        }
                        placeholder="Optional requirements or notes"
                        rows={2}
                        className="bg-[#111111] border-[#262626] resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Concert Tab */}
        <TabsContent value="concert" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#FAFAFA]">Concert / Event</h3>
                <p className="text-sm text-[#71717A]">
                  Enable if this celebrity has an upcoming concert or event
                </p>
              </div>
              <Switch
                checked={concertEnabled}
                onCheckedChange={setConcertEnabled}
              />
            </div>

            {concertEnabled && (
              <div className="space-y-6 pt-4 border-t border-[#262626]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={concertTitle}
                      onChange={(e) => setConcertTitle(e.target.value)}
                      placeholder="Concert title"
                      className="bg-[#0a0a0a] border-[#262626]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      value={concertVenue}
                      onChange={(e) => setConcertVenue(e.target.value)}
                      placeholder="Venue name"
                      className="bg-[#0a0a0a] border-[#262626]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-[#262626] bg-[#0a0a0a]",
                            !concertDate && "text-[#71717A]"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {concertDate
                            ? format(concertDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#111111] border-[#262626]">
                        <Calendar
                          mode="single"
                          selected={concertDate}
                          onSelect={setConcertDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={concertCity}
                      onChange={(e) => setConcertCity(e.target.value)}
                      placeholder="City"
                      className="bg-[#0a0a0a] border-[#262626]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={concertCountry}
                      onChange={(e) => setConcertCountry(e.target.value)}
                      placeholder="Country"
                      className="bg-[#0a0a0a] border-[#262626]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={concertDescription}
                    onChange={(e) => setConcertDescription(e.target.value)}
                    placeholder="Event description"
                    rows={3}
                    className="bg-[#0a0a0a] border-[#262626] resize-none"
                  />
                </div>

                {/* Ticket Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ticket Tiers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTicketTier}
                      className="border-[#262626]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>

                  {ticketTiers.length === 0 ? (
                    <p className="text-sm text-[#71717A]">No ticket tiers added</p>
                  ) : (
                    <div className="space-y-3">
                      {ticketTiers.map((tier, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#A1A1AA]">
                              Tier {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTicketTier(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input
                              placeholder="Name"
                              value={tier.name}
                              onChange={(e) =>
                                updateTicketTier(index, "name", e.target.value)
                              }
                              className="bg-[#111111] border-[#262626]"
                            />
                            <Input
                              type="number"
                              placeholder="Price"
                              value={tier.price}
                              onChange={(e) =>
                                updateTicketTier(index, "price", e.target.value)
                              }
                              className="bg-[#111111] border-[#262626]"
                            />
                            <Input
                              type="number"
                              placeholder="Total Slots"
                              value={tier.totalSlots}
                              onChange={(e) =>
                                updateTicketTier(index, "totalSlots", e.target.value)
                              }
                              className="bg-[#111111] border-[#262626]"
                            />
                            <Input
                              placeholder="Perks"
                              value={tier.perks || ""}
                              onChange={(e) =>
                                updateTicketTier(index, "perks", e.target.value)
                              }
                              className="bg-[#111111] border-[#262626]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Manager Name</Label>
                <Input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager's full name"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>

              <div className="space-y-2">
                <Label>Manager Email</Label>
                <Input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Manager Phone</Label>
                <Input
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>

              <div className="space-y-2">
                <Label>Agency Name</Label>
                <Input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Talent agency name"
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Private notes (admin-only, not visible to public)"
                rows={4}
                className="bg-[#0a0a0a] border-[#262626] resize-none"
              />
              <p className="text-xs text-[#71717A]">
                These notes are only visible to administrators
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <div>
                <p className="font-medium text-[#FAFAFA]">Active Status</p>
                <p className="text-sm text-[#71717A]">
                  Celebrity is visible on the platform
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <div>
                <p className="font-medium text-[#FAFAFA]">Featured</p>
                <p className="text-sm text-[#71717A]">
                  Display on homepage and featured sections
                </p>
              </div>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>

            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="bg-[#0a0a0a] border-[#262626] w-32"
              />
              <p className="text-xs text-[#71717A]">
                Lower numbers appear first (default: 0)
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="sticky bottom-0 bg-[#050505] border-t border-[#262626] -mx-4 md:-mx-6 px-4 md:px-6 py-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/celebrities")}
          className="border-[#262626] hover:bg-[#1a1a1a]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#C9A96E] text-black hover:bg-[#D4B87A]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Celebrity"
          )}
        </Button>
      </div>
    </div>
  );
}
