"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Settings,
  Globe,
  Home,
  Phone,
  Search as SearchIcon,
  ToggleLeft,
  FileText,
  User,
  Users,
  Plus,
  Trash2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload";
import {
  updateSiteSettings,
  updateAdminProfile,
  changeAdminPassword,
  createAdmin,
  deleteAdmin,
} from "@/lib/actions/admin/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface SiteSocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

interface SerializedSiteSettings {
  _id: string;
  siteName: string;
  siteDescription?: string;
  logo?: CloudinaryImage;
  favicon?: CloudinaryImage;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: CloudinaryImage;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  businessHours?: string;
  socialLinks?: SiteSocialLinks;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: CloudinaryImage;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  showFeaturedOnly: boolean;
  termsOfService?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
}

interface SerializedAdmin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface SettingsClientProps {
  settings: SerializedSiteSettings;
  profile: SerializedAdmin;
  admins: SerializedAdmin[];
  isSuperAdmin: boolean;
}

export default function SettingsClient({
  settings: initialSettings,
  profile: initialProfile,
  admins: initialAdmins,
  isSuperAdmin,
}: SettingsClientProps) {
  const router = useRouter();

  const [settings, setSettings] = useState(initialSettings);
  const [profile, setProfile] = useState(initialProfile);
  const [admins, setAdmins] = useState(initialAdmins);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-[#C9A96E]" />
        <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-[#111111] border border-[#262626] p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <Globe className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="homepage" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <Home className="w-4 h-4 mr-2" />
            Homepage
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <SearchIcon className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <ToggleLeft className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="legal" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="admins" className="data-[state=active]:bg-[#C9A96E] data-[state=active]:text-black">
              <Users className="w-4 h-4 mr-2" />
              Admins
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <GeneralTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="homepage">
          <HomepageTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="contact">
          <ContactTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="seo">
          <SeoTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="features">
          <FeaturesTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="legal">
          <LegalTab settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileTab profile={profile} setProfile={setProfile} />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="admins">
            <AdminsTab admins={admins} setAdmins={setAdmins} currentAdminId={profile._id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function GeneralTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setFile(file);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let uploadedLogo: { url: string; publicId: string } | undefined;
      let uploadedFavicon: { url: string; publicId: string } | undefined;

      if (logoFile) {
        uploadedLogo = await uploadToCloudinary(logoFile, "settings/logo");
      }
      if (faviconFile) {
        uploadedFavicon = await uploadToCloudinary(faviconFile, "settings/favicon");
      }

      const result = await updateSiteSettings(
        { siteName, siteDescription },
        uploadedLogo,
        uploadedFavicon
      );

      if (result.success && result.data) {
        setSettings(result.data);
        setLogoPreview(null);
        setFaviconPreview(null);
        setLogoFile(null);
        setFaviconFile(null);
        toast.success("Settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to upload images");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteDescription">Site Description</Label>
          <Textarea
            id="siteDescription"
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            rows={3}
            className="bg-[#0a0a0a] border-[#262626] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-[#0a0a0a] border border-[#262626] flex items-center justify-center overflow-hidden">
                {logoPreview || settings.logo?.url ? (
                  <Image
                    src={logoPreview || settings.logo?.url || ""}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-[#71717A]" />
                )}
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, setLogoPreview, setLogoFile)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="border-[#262626] hover:bg-[#1a1a1a]"
                >
                  Change Logo
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Favicon</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-[#0a0a0a] border border-[#262626] flex items-center justify-center overflow-hidden">
                {faviconPreview || settings.favicon?.url ? (
                  <Image
                    src={faviconPreview || settings.favicon?.url || ""}
                    alt="Favicon"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                ) : (
                  <Upload className="w-6 h-6 text-[#71717A]" />
                )}
              </div>
              <div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/x-icon"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e, setFaviconPreview, setFaviconFile)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => faviconInputRef.current?.click()}
                  className="border-[#262626] hover:bg-[#1a1a1a]"
                >
                  Change Favicon
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function HomepageTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || "");
  const [heroCtaPrimary, setHeroCtaPrimary] = useState(settings.heroCtaPrimary || "");
  const [heroCtaSecondary, setHeroCtaSecondary] = useState(settings.heroCtaSecondary || "");
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  const heroImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setHeroImagePreview(URL.createObjectURL(file));
    setHeroImageFile(file);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let uploadedHero: { url: string; publicId: string } | undefined;

      if (heroImageFile) {
        uploadedHero = await uploadToCloudinary(heroImageFile, "settings/hero");
      }

      const result = await updateSiteSettings(
        { heroTitle, heroSubtitle, heroCtaPrimary, heroCtaSecondary },
        undefined,
        undefined,
        uploadedHero
      );

      if (result.success && result.data) {
        setSettings(result.data);
        setHeroImagePreview(null);
        setHeroImageFile(null);
        toast.success("Settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to upload image");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="heroTitle">Hero Title</Label>
          <Input
            id="heroTitle"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Welcome to CelebConnect"
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
          <Textarea
            id="heroSubtitle"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            rows={2}
            placeholder="Book your favorite celebrities for exclusive experiences"
            className="bg-[#0a0a0a] border-[#262626] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Hero Image</Label>
          <div className="space-y-3">
            <div className="aspect-[21/9] max-w-2xl rounded-lg bg-[#0a0a0a] border border-[#262626] flex items-center justify-center overflow-hidden">
              {heroImagePreview || settings.heroImage?.url ? (
                <Image
                  src={heroImagePreview || settings.heroImage?.url || ""}
                  alt="Hero"
                  width={800}
                  height={343}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-[#71717A] mb-2" />
                  <p className="text-sm text-[#71717A]">No hero image</p>
                </div>
              )}
            </div>
            <input
              ref={heroImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => heroImageInputRef.current?.click()}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Change Hero Image
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="heroCtaPrimary">Primary CTA Text</Label>
            <Input
              id="heroCtaPrimary"
              value={heroCtaPrimary}
              onChange={(e) => setHeroCtaPrimary(e.target.value)}
              placeholder="Browse Celebrities"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heroCtaSecondary">Secondary CTA Text</Label>
            <Input
              id="heroCtaSecondary"
              value={heroCtaSecondary}
              onChange={(e) => setHeroCtaSecondary(e.target.value)}
              placeholder="Learn More"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function ContactTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || "");
  const [contactAddress, setContactAddress] = useState(settings.contactAddress || "");
  const [contactCity, setContactCity] = useState(settings.contactCity || "");
  const [businessHours, setBusinessHours] = useState(settings.businessHours || "");
  const [socialLinks, setSocialLinks] = useState<SiteSocialLinks>(settings.socialLinks || {});

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateSiteSettings({
      contactEmail,
      contactPhone,
      contactAddress,
      contactCity,
      businessHours,
      socialLinks,
    });

    if (result.success && result.data) {
      setSettings(result.data);
      toast.success("Settings saved");
    } else {
      toast.error(result.error || "Failed to save settings");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@celebconnect.com"
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactAddress">Street Address</Label>
            <Input
              id="contactAddress"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="123 Celebrity Lane"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactCity">City, State & ZIP</Label>
            <Input
              id="contactCity"
              value={contactCity}
              onChange={(e) => setContactCity(e.target.value)}
              placeholder="Los Angeles, CA 90001"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessHours">Business Hours</Label>
          <Input
            id="businessHours"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="Mon-Fri 9AM-6PM EST"
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <Separator className="bg-[#262626]" />

        <h3 className="text-sm font-medium text-[#A1A1AA]">Social Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={socialLinks.instagram || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              placeholder="https://instagram.com/celebconnect"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter / X</Label>
            <Input
              id="twitter"
              value={socialLinks.twitter || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              placeholder="https://twitter.com/celebconnect"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok">TikTok</Label>
            <Input
              id="tiktok"
              value={socialLinks.tiktok || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@celebconnect"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              value={socialLinks.youtube || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
              placeholder="https://youtube.com/celebconnect"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={socialLinks.facebook || ""}
              onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
              placeholder="https://facebook.com/celebconnect"
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function SeoTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [metaTitle, setMetaTitle] = useState(settings.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(settings.metaDescription || "");
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);

  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setOgImagePreview(URL.createObjectURL(file));
    setOgImageFile(file);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let uploadedOg: { url: string; publicId: string } | undefined;

      if (ogImageFile) {
        uploadedOg = await uploadToCloudinary(ogImageFile, "settings/og");
      }

      const result = await updateSiteSettings(
        { metaTitle, metaDescription },
        undefined,
        undefined,
        undefined,
        uploadedOg
      );

      if (result.success && result.data) {
        setSettings(result.data);
        setOgImagePreview(null);
        setOgImageFile(null);
        toast.success("Settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to upload image");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="CelebConnect — Book Your Favorite Celebrities"
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <span className="text-xs text-[#71717A]">{metaDescription.length}/300</span>
          </div>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Book exclusive experiences with your favorite celebrities..."
            className="bg-[#0a0a0a] border-[#262626] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>OG Image (Social Share)</Label>
          <div className="space-y-3">
            <div className="aspect-[1.91/1] max-w-md rounded-lg bg-[#0a0a0a] border border-[#262626] flex items-center justify-center overflow-hidden">
              {ogImagePreview || settings.ogImage?.url ? (
                <Image
                  src={ogImagePreview || settings.ogImage?.url || ""}
                  alt="OG Image"
                  width={400}
                  height={209}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-[#71717A] mb-2" />
                  <p className="text-sm text-[#71717A]">1200x630 recommended</p>
                </div>
              )}
            </div>
            <input
              ref={ogImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => ogImageInputRef.current?.click()}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Change OG Image
            </Button>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function FeaturesTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);
  const [registrationEnabled, setRegistrationEnabled] = useState(settings.registrationEnabled);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(settings.showFeaturedOnly);

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateSiteSettings({
      maintenanceMode,
      registrationEnabled,
      showFeaturedOnly,
    });

    if (result.success && result.data) {
      setSettings(result.data);
      toast.success("Settings saved");
    } else {
      toast.error(result.error || "Failed to save settings");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[#FAFAFA]">Maintenance Mode</p>
            <p className="text-sm text-[#71717A]">Take the site offline for maintenance</p>
          </div>
          <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
        </div>

        <Separator className="bg-[#262626]" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[#FAFAFA]">Registration Enabled</p>
            <p className="text-sm text-[#71717A]">Allow new client registrations</p>
          </div>
          <Switch checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
        </div>

        <Separator className="bg-[#262626]" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[#FAFAFA]">Show Featured Only</p>
            <p className="text-sm text-[#71717A]">Only show featured celebrities on public pages</p>
          </div>
          <Switch checked={showFeaturedOnly} onCheckedChange={setShowFeaturedOnly} />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function LegalTab({
  settings,
  setSettings,
}: {
  settings: SerializedSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SerializedSiteSettings>>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [termsOfService, setTermsOfService] = useState(settings.termsOfService || "");
  const [privacyPolicy, setPrivacyPolicy] = useState(settings.privacyPolicy || "");
  const [refundPolicy, setRefundPolicy] = useState(settings.refundPolicy || "");

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateSiteSettings({
      termsOfService,
      privacyPolicy,
      refundPolicy,
    });

    if (result.success && result.data) {
      setSettings(result.data);
      toast.success("Settings saved");
    } else {
      toast.error(result.error || "Failed to save settings");
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="termsOfService">Terms of Service</Label>
          <Textarea
            id="termsOfService"
            value={termsOfService}
            onChange={(e) => setTermsOfService(e.target.value)}
            rows={10}
            placeholder="Enter your terms of service..."
            className="bg-[#0a0a0a] border-[#262626] resize-none font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacyPolicy">Privacy Policy</Label>
          <Textarea
            id="privacyPolicy"
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            rows={10}
            placeholder="Enter your privacy policy..."
            className="bg-[#0a0a0a] border-[#262626] resize-none font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="refundPolicy">Refund Policy</Label>
          <Textarea
            id="refundPolicy"
            value={refundPolicy}
            onChange={(e) => setRefundPolicy(e.target.value)}
            rows={10}
            placeholder="Enter your refund policy..."
            className="bg-[#0a0a0a] border-[#262626] resize-none font-mono text-sm"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
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
  );
}

function ProfileTab({
  profile,
  setProfile,
}: {
  profile: SerializedAdmin;
  setProfile: React.Dispatch<React.SetStateAction<SerializedAdmin>>;
}) {
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);

    const result = await updateAdminProfile({ firstName, lastName, email });

    if (result.success && result.data) {
      setProfile(result.data);
      toast.success("Profile updated");
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    setIsSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    setIsChangingPassword(true);

    const result = await changeAdminPassword(currentPassword, newPassword);

    if (result.success) {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      toast.error(result.error || "Failed to change password");
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
        <h3 className="font-medium text-[#FAFAFA]">Profile Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0a0a0a] border-[#262626]"
          />
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={isSavingProfile}
          className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
        >
          {isSavingProfile ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </div>

      <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
        <h3 className="font-medium text-[#FAFAFA]">Change Password</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-[#0a0a0a] border-[#262626]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#0a0a0a] border-[#262626]"
            />
            <p className="text-xs text-[#71717A]">
              Min 8 characters, 1 uppercase, 1 lowercase, 1 number
            </p>
          </div>
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={isChangingPassword}
          variant="outline"
          className="border-[#262626] hover:bg-[#1a1a1a]"
        >
          {isChangingPassword ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </div>
    </div>
  );
}

function AdminsTab({
  admins,
  setAdmins,
  currentAdminId,
}: {
  admins: SerializedAdmin[];
  setAdmins: React.Dispatch<React.SetStateAction<SerializedAdmin[]>>;
  currentAdminId: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<SerializedAdmin | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
  });

  const handleCreate = async () => {
    setIsCreating(true);

    const result = await createAdmin(newAdmin);

    if (result.success && result.data) {
      setAdmins((prev) => [result.data!, ...prev]);
      setDialogOpen(false);
      setNewAdmin({ firstName: "", lastName: "", email: "", password: "", role: "admin" });
      toast.success("Admin created");
    } else {
      toast.error(result.error || "Failed to create admin");
    }

    setIsCreating(false);
  };

  const handleDeleteClick = (admin: SerializedAdmin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    setIsDeleting(true);
    const result = await deleteAdmin(adminToDelete._id);

    if (result.success) {
      setAdmins((prev) => prev.filter((a) => a._id !== adminToDelete._id));
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
      toast.success("Admin deleted");
    } else {
      toast.error(result.error || "Failed to delete admin");
    }

    setIsDeleting(false);
  };

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#FAFAFA]">Admin Accounts</h3>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="space-y-3">
        {admins.map((admin) => (
          <div
            key={admin._id}
            className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-[#FAFAFA]">
                  {admin.firstName} {admin.lastName}
                </p>
                <Badge
                  variant="outline"
                  className={
                    admin.role === "super_admin"
                      ? "border-[#C9A96E] text-[#C9A96E]"
                      : "border-[#262626] text-[#71717A]"
                  }
                >
                  {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
                {admin._id === currentAdminId && (
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#71717A]">{admin.email}</p>
              <p className="text-xs text-[#71717A] mt-1">
                Created {formatDate(admin.createdAt)}
              </p>
            </div>

            {admin._id !== currentAdminId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(admin)}
                className="text-[#71717A] hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Add Admin</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Create a new admin account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newFirstName">First Name</Label>
                <Input
                  id="newFirstName"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLastName">Last Name</Label>
                <Input
                  id="newLastName"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  className="bg-[#0a0a0a] border-[#262626]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="bg-[#0a0a0a] border-[#262626]"
              />
              <p className="text-xs text-[#71717A]">
                Min 8 characters, 1 uppercase, 1 lowercase, 1 number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newRole">Role</Label>
              <Select
                value={newAdmin.role}
                onValueChange={(value: "admin" | "super_admin") =>
                  setNewAdmin({ ...newAdmin, role: value })
                }
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#262626]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#262626]">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newAdmin.firstName || !newAdmin.email || !newAdmin.password}
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA]">Delete Admin</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete{" "}
              <span className="font-medium text-[#FAFAFA]">
                {adminToDelete?.firstName} {adminToDelete?.lastName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#262626] hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
