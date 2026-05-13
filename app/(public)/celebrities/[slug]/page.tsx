import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  Globe,
  Award,
  Languages,
  ExternalLink,
} from "lucide-react";

import { getPublicCelebrityBySlug } from "@/lib/actions/public/celebrities";
import { formatCurrency } from "@/lib/utils";
import { BOOKING_TYPES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pageTitle, siteConfig } from "@/lib/site-config";

interface CelebrityProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CelebrityProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicCelebrityBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: pageTitle("Celebrity Not Found"),
    };
  }

  const celebrity = result.data;

  return {
    title: pageTitle(celebrity.name),
    description:
      celebrity.shortBio ||
      `Book ${celebrity.name} for exclusive experiences through ${siteConfig.name}.`,
  };
}

export default async function CelebrityProfilePage({
  params,
}: CelebrityProfilePageProps) {
  const { slug } = await params;
  const result = await getPublicCelebrityBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const celebrity = result.data;

  const getServiceLabel = (type: string) => {
    const service = BOOKING_TYPES.find((t) => t.value === type);
    return service?.label || type;
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative">
        {/* Cover Image */}
        <div className="h-64 lg:h-80 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
          {celebrity.coverImage?.url ? (
            <Image
              src={celebrity.coverImage.url}
              alt={`${celebrity.name} cover`}
              fill
              className="object-cover opacity-50"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/20 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
            {/* Profile Image */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-[#C9A96E] overflow-hidden bg-[#111111]">
                {celebrity.profileImage?.url ? (
                  <Image
                    src={celebrity.profileImage.url}
                    alt={celebrity.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-[#C9A96E]">
                    {celebrity.name.charAt(0)}
                  </div>
                )}
              </div>
              {celebrity.featured && (
                <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-[#C9A96E] flex items-center justify-center">
                  <Star className="w-5 h-5 text-black fill-black" />
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
                  {celebrity.name}
                </h1>
                <Badge className="bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/30">
                  {celebrity.category}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[#A1A1AA]">
                {celebrity.nationality && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {celebrity.nationality}
                  </span>
                )}
                {celebrity.languages && celebrity.languages.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-4 h-4" />
                    {celebrity.languages.join(", ")}
                  </span>
                )}
              </div>

              {celebrity.knownFor && (
                <p className="mt-3 text-lg text-[#C9A96E] italic">
                  &ldquo;{celebrity.knownFor}&rdquo;
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="lg:pb-4">
              <Button
                asChild
                size="lg"
                className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium"
              >
                <Link href="/register">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              {celebrity.bio && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4">
                    About
                  </h2>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-[#A1A1AA] whitespace-pre-line">
                      {celebrity.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Achievements */}
              {celebrity.achievements && celebrity.achievements.length > 0 && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C9A96E]" />
                    Achievements
                  </h2>
                  <ul className="space-y-2">
                    {celebrity.achievements.map((achievement, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-[#A1A1AA]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] mt-2 shrink-0" />
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gallery */}
              {celebrity.gallery && celebrity.gallery.length > 0 && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {celebrity.gallery.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden relative"
                      >
                        <Image
                          src={image.url}
                          alt={`${celebrity.name} gallery ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Available Services */}
              {celebrity.availableServices.length > 0 && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4">
                    Available Experiences
                  </h2>
                  <div className="space-y-4">
                    {celebrity.availableServices.map((service) => (
                      <div
                        key={service.type}
                        className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-[#FAFAFA]">
                            {getServiceLabel(service.type)}
                          </h3>
                          <span className="text-[#C9A96E] font-semibold">
                            {formatCurrency(service.basePrice)}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-[#71717A]">
                            {service.description}
                          </p>
                        )}
                        <Button
                          asChild
                          size="sm"
                          className="w-full mt-3 bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                        >
                          <Link
                            href={`/register?redirect=/dashboard/bookings/new?celebrity=${celebrity.slug}&type=${service.type}`}
                          >
                            Book This
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {celebrity.socialLinks && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-xl font-semibold text-[#FAFAFA] mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#C9A96E]" />
                    Connect
                  </h2>
                  <div className="space-y-3">
                    {celebrity.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${celebrity.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                    {celebrity.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${celebrity.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Twitter / X
                      </a>
                    )}
                    {celebrity.socialLinks.tiktok && (
                      <a
                        href={`https://tiktok.com/@${celebrity.socialLinks.tiktok}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        TikTok
                      </a>
                    )}
                    {celebrity.socialLinks.youtube && (
                      <a
                        href={`https://youtube.com/${celebrity.socialLinks.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        YouTube
                      </a>
                    )}
                    {celebrity.socialLinks.website && (
                      <a
                        href={celebrity.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#C9A96E] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {celebrity.tags && celebrity.tags.length > 0 && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
                  <h2 className="font-display text-lg font-semibold text-[#FAFAFA] mb-3">
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {celebrity.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-[#262626] text-[#A1A1AA]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
            Ready to Book {celebrity.name}?
          </h2>
          <p className="mt-4 text-[#A1A1AA]">
            Create your account to get started with your booking request
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-8"
            >
              <Link href="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[#262626]">
              <Link href="/celebrities">Browse More Celebrities</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
