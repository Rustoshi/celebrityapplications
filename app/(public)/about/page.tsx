import { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Users,
  Globe,
  Sparkles,
  Star,
  Heart,
  Zap,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig, pageTitle } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle("About Us"),
  description: `Learn about ${siteConfig.name}, the premier celebrity booking platform. We connect people with world-class talent for unforgettable experiences.`,
};

const features = [
  {
    icon: Star,
    title: "Curated Roster",
    description:
      "Only verified, high-profile celebrities make it onto our platform. Each talent is personally vetted to ensure authenticity and professionalism.",
  },
  {
    icon: Users,
    title: "White-Glove Service",
    description:
      "Every booking comes with dedicated concierge support. From initial inquiry to event completion, we handle every detail.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Bank-level encryption protects all transactions. Your personal information and booking details remain completely confidential.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Connect with celebrities from around the world. Our network spans continents, bringing international talent to your doorstep.",
  },
];

const values = [
  {
    icon: Sparkles,
    title: "Excellence",
    description: "We deliver nothing but the best in every interaction.",
  },
  {
    icon: Heart,
    title: "Trust",
    description: "Transparency and integrity guide all our relationships.",
  },
  {
    icon: Award,
    title: "Exclusivity",
    description: "Access to experiences money alone cannot buy.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Constantly evolving to exceed expectations.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-20 lg:py-28 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#C9A96E]/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-[#FAFAFA]">
              About {siteConfig.name}
            </h1>
            <div className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
            <p className="mt-6 text-xl text-[#C9A96E] font-display">
              The Premier Celebrity Booking Platform
            </p>
            <p className="mt-4 text-lg text-[#A1A1AA]">
              Where extraordinary moments begin
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
                Our Story
              </h2>
              <div className="mt-4 h-1 w-16 bg-gradient-to-r from-[#C9A96E] to-transparent" />

              <div className="mt-8 space-y-6 text-[#A1A1AA]">
                <p>
                  {siteConfig.name} was born from a simple yet powerful vision: to
                  bridge the gap between celebrities and their admirers through
                  curated, premium experiences that create lasting memories.
                </p>
                <p>
                  We recognized that while many dream of meeting their favorite
                  celebrities, the path to making that happen was often unclear,
                  unreliable, or simply inaccessible. We set out to change that.
                </p>
                <p>
                  Today, {siteConfig.name} stands as the definitive platform for
                  celebrity bookings, offering a seamless, secure, and luxurious
                  experience from first inquiry to final moment. Our curated
                  roster of verified talent spans every category imaginable,
                  from A-list actors and chart-topping musicians to legendary
                  athletes and influential thought leaders.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#262626] p-8 lg:p-12">
                <div className="h-full rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-display text-6xl font-bold text-[#C9A96E]">
                      2024
                    </p>
                    <p className="text-[#71717A] mt-2">Founded</p>
                    <div className="mt-8 pt-8 border-t border-[#262626]">
                      <p className="font-display text-4xl font-bold text-[#FAFAFA]">
                        500+
                      </p>
                      <p className="text-[#71717A] mt-1">Verified Celebrities</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#C9A96E]/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#C9A96E]/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 lg:py-24 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
            Our Mission
          </h2>
          <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />

          <div className="mt-10 p-8 lg:p-12 bg-[#111111] border border-[#262626] rounded-2xl">
            <p className="text-xl lg:text-2xl text-[#A1A1AA] leading-relaxed italic">
              &ldquo;To create unforgettable moments by connecting people with
              world-class talent through a seamless, secure, and luxurious
              booking platform.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
              What Sets Us Apart
            </h2>
            <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 lg:p-8 bg-[#111111] border border-[#262626] rounded-xl hover:border-[#C9A96E]/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#C9A96E]" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#FAFAFA] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#A1A1AA]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 lg:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
              Our Values
            </h2>
            <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-[#C9A96E]" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-[#71717A]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
            Ready to Experience the Extraordinary?
          </h2>
          <p className="mt-6 text-lg text-[#A1A1AA]">
            Join thousands of clients who have created unforgettable memories
            through {siteConfig.name}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-10 h-14 text-lg"
            >
              <Link href="/register">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#262626] px-10 h-14 text-lg"
            >
              <Link href="/celebrities">Browse Celebrities</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
