"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  MapPin,
  Globe,
  Calendar,
  Ticket,
  X,
  ExternalLink,
} from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
}

interface TicketTier {
  name: string;
  price: number;
  totalSlots: number;
  soldSlots: number;
  perks?: string;
}

interface ConcertDetails {
  title: string;
  venue: string;
  date: string;
  city: string;
  country: string;
  description?: string;
  posterImage?: CloudinaryImage;
  ticketTiers: TicketTier[];
}

interface SerializedFullPublicCelebrity {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  shortBio?: string;
  category: string;
  subcategories?: string[];
  profileImage?: CloudinaryImage;
  coverImage?: CloudinaryImage;
  gallery?: CloudinaryImage[];
  nationality?: string;
  knownFor?: string;
  achievements?: string[];
  languages?: string[];
  socialLinks?: SocialLinks;
  availableServices: AvailableService[];
  concertEnabled: boolean;
  concertDetails?: ConcertDetails;
  featured: boolean;
  tags?: string[];
}

interface CelebrityProfileProps {
  celebrity: SerializedFullPublicCelebrity;
}

export default function CelebrityProfile({ celebrity }: CelebrityProfileProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getServiceInfo = (type: string) => {
    return BOOKING_TYPES.find((t) => t.value === type);
  };

  const activeServices = celebrity.availableServices.filter((s) => s.isActive);

  const openGalleryImage = (url: string) => {
    setSelectedImage(url);
    setGalleryOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/dashboard/celebrities"
        className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Celebrities
      </Link>

      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-64 lg:h-80 rounded-xl overflow-hidden">
          {celebrity.coverImage?.url ? (
            <Image
              src={celebrity.coverImage.url}
              alt={`${celebrity.name} cover`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#C9A96E]/20 via-[#1a1a1a] to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="relative -mt-20 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            {/* Profile Image */}
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-[#C9A96E] overflow-hidden bg-[#111111] shrink-0">
              {celebrity.profileImage?.url ? (
                <Image
                  src={celebrity.profileImage.url}
                  alt={celebrity.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-display text-[#C9A96E]">
                  {celebrity.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
                  {celebrity.name}
                </h1>
                {celebrity.featured && (
                  <Badge className="bg-[#C9A96E] text-black gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[#A1A1AA]">
                <Badge variant="outline" className="border-[#262626]">
                  {celebrity.category}
                </Badge>
                {celebrity.nationality && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {celebrity.nationality}
                  </span>
                )}
              </div>

              {celebrity.knownFor && (
                <p className="mt-3 text-[#C9A96E] italic">
                  &ldquo;{celebrity.knownFor}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4">
          About
        </h2>
        {celebrity.bio ? (
          <p className="text-[#A1A1AA] whitespace-pre-wrap leading-relaxed">
            {celebrity.bio}
          </p>
        ) : celebrity.shortBio ? (
          <p className="text-[#A1A1AA]">{celebrity.shortBio}</p>
        ) : (
          <p className="text-[#71717A] italic">No biography available.</p>
        )}

        {/* Achievements */}
        {celebrity.achievements && celebrity.achievements.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">
              Achievements
            </h3>
            <ul className="space-y-2">
              {celebrity.achievements.map((achievement, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-[#A1A1AA]"
                >
                  <Star className="w-4 h-4 text-[#C9A96E] mt-0.5 shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages */}
        {celebrity.languages && celebrity.languages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {celebrity.languages.map((language) => (
                <Badge
                  key={language}
                  variant="outline"
                  className="border-[#262626] text-[#A1A1AA]"
                >
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available Services */}
      {activeServices.length > 0 && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-6">
            Available Services
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeServices.map((service) => {
              const serviceInfo = getServiceInfo(service.type);
              const Icon = serviceInfo?.icon;

              return (
                <div
                  key={service.type}
                  className="p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-[#C9A96E]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {Icon && (
                        <div className="p-2 rounded-lg bg-[#C9A96E]/10">
                          <Icon className="w-5 h-5 text-[#C9A96E]" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-[#FAFAFA]">
                          {serviceInfo?.label || service.type}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-[#71717A] mt-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold text-[#C9A96E]">
                        {formatCurrency(service.basePrice)}
                      </p>
                      <p className="text-xs text-[#71717A]">starting price</p>
                    </div>
                  </div>

                  {service.requirements && (
                    <p className="text-xs text-[#71717A] mt-3 pl-11">
                      Requirements: {service.requirements}
                    </p>
                  )}

                  <div className="mt-4 pl-11">
                    <Button
                      asChild
                      size="sm"
                      className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                    >
                      <Link
                        href={`/dashboard/bookings/new?celebrity=${celebrity.slug}&type=${service.type}`}
                      >
                        Book Now
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Concert Section */}
      {celebrity.concertEnabled && celebrity.concertDetails && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="w-5 h-5 text-[#C9A96E]" />
            <h2 className="font-display text-xl font-semibold text-[#FAFAFA]">
              Upcoming Concert
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Poster */}
            {celebrity.concertDetails.posterImage?.url && (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                <Image
                  src={celebrity.concertDetails.posterImage.url}
                  alt={celebrity.concertDetails.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div
              className={cn(
                celebrity.concertDetails.posterImage?.url
                  ? "lg:col-span-2"
                  : "lg:col-span-3"
              )}
            >
              <h3 className="font-display text-2xl font-semibold text-[#FAFAFA] mb-2">
                {celebrity.concertDetails.title}
              </h3>

              <div className="space-y-2 text-[#A1A1AA] mb-4">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C9A96E]" />
                  {celebrity.concertDetails.venue}, {celebrity.concertDetails.city},{" "}
                  {celebrity.concertDetails.country}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C9A96E]" />
                  {formatDate(celebrity.concertDetails.date)}
                </p>
              </div>

              {celebrity.concertDetails.description && (
                <p className="text-[#A1A1AA] mb-6">
                  {celebrity.concertDetails.description}
                </p>
              )}

              {/* Ticket Tiers */}
              {celebrity.concertDetails.ticketTiers &&
                celebrity.concertDetails.ticketTiers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#FAFAFA] mb-3">
                      Ticket Options
                    </h4>
                    <div className="space-y-3">
                      {celebrity.concertDetails.ticketTiers.map((tier, index) => {
                        const available = tier.totalSlots - tier.soldSlots;
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-[#FAFAFA]">
                                {tier.name}
                              </p>
                              {tier.perks && (
                                <p className="text-xs text-[#71717A]">
                                  {tier.perks}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#C9A96E]">
                                {formatCurrency(tier.price)}
                              </p>
                              <p className="text-xs text-[#71717A]">
                                {available > 0
                                  ? `${available} available`
                                  : "Sold out"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      asChild
                      className="mt-4 bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                    >
                      <Link
                        href={`/dashboard/bookings/new?celebrity=${celebrity.slug}&type=live_performance`}
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        Book Tickets
                      </Link>
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      {celebrity.gallery && celebrity.gallery.length > 0 && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-6">
            Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {celebrity.gallery.map((image, index) => (
              <button
                key={index}
                onClick={() => openGalleryImage(image.url)}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <Image
                  src={image.url}
                  alt={`${celebrity.name} gallery ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {celebrity.socialLinks && Object.values(celebrity.socialLinks).some(Boolean) && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4">
            Connect
          </h2>
          <div className="flex flex-wrap gap-3">
            {celebrity.socialLinks.instagram && (
              <a
                href={celebrity.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#A1A1AA] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {celebrity.socialLinks.twitter && (
              <a
                href={celebrity.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#A1A1AA] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">X / Twitter</span>
              </a>
            )}
            {celebrity.socialLinks.youtube && (
              <a
                href={celebrity.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#A1A1AA] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">YouTube</span>
              </a>
            )}
            {celebrity.socialLinks.facebook && (
              <a
                href={celebrity.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#A1A1AA] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Facebook</span>
              </a>
            )}
            {celebrity.socialLinks.website && (
              <a
                href={celebrity.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#A1A1AA] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">Website</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl bg-[#0a0a0a] border-[#262626] p-0">
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="Gallery image"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
