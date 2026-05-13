"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Utensils,
  Video,
  Music,
  PartyPopper,
  Stars,
  CalendarCheck,
  Sparkles,
  Check,
  Shield,
  Headphones,
  Settings2,
  Quote,
  ArrowRight,
  Users,
  Award,
  Globe,
  Heart,
  ChevronDown,
} from "lucide-react";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { siteConfig } from "@/lib/site-config";
import {
  getPublicFeaturedCelebrities,
  type PublicCelebrity,
} from "@/lib/actions/public/celebrities";

const sliderImages = [
  "/images/slider/slider1.jpg",
  "/images/slider/slider2.webp",
  "/images/slider/slider3.webp",
  "/images/slider/slider4.jpg",
  "/images/slider/slider5.webp",
];

const services = [
  {
    icon: Utensils,
    title: "Private Dining",
    description: "Curated dining experiences with A-list talent in exclusive venues",
  },
  {
    icon: Video,
    title: "Virtual Appearances",
    description: "Live video engagements for corporate events, press, and private sessions",
  },
  {
    icon: Music,
    title: "Live Performances",
    description: "Concert-grade performances for galas, launches, and milestone celebrations",
  },
  {
    icon: PartyPopper,
    title: "Event Appearances",
    description: "Red-carpet presence, brand endorsements, and keynote engagements",
  },
];

const experienceImages = [
  { src: "/images/experiences/event1.jpg", alt: "Corporate gala event", label: "Corporate Galas" },
  { src: "/images/experiences/event2.jpg", alt: "Elegant dinner party", label: "Private Dinners" },
  { src: "/images/experiences/event3.jpg", alt: "Live concert performance", label: "Live Performances" },
  { src: "/images/experiences/event4.jpg", alt: "VIP party experience", label: "VIP Events" },
];

const steps = [
  {
    number: "01",
    icon: Stars,
    title: "Select Talent",
    description: "Browse our vetted roster of world-class celebrities, athletes, and performers",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Submit Your Brief",
    description: "Share your event details. Our team handles availability, contracts, and logistics",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Experience Delivered",
    description: "We manage every detail end-to-end so you can focus on the moment",
  },
];

const stats = [
  { icon: Users, value: "200+", label: "Verified Talent" },
  { icon: Award, value: "5,000+", label: "Engagements Delivered" },
  { icon: Globe, value: "40+", label: "Countries" },
  { icon: Heart, value: "98%", label: "Client Retention" },
];

const getTestimonials = (siteName: string) => [
  {
    name: "Michael Thompson",
    role: "Director of Events, Meridian Group",
    quote: `${siteName} delivered a seamless A-list appearance for our annual summit. The professionalism and discretion were exactly what we needed at this level.`,
    rating: 5,
  },
  {
    name: "Sarah Mitchell",
    role: "Private Client",
    quote: "They arranged a private performance for my husband's 50th in under two weeks. The attention to detail was extraordinary — truly white-glove service.",
    rating: 5,
  },
  {
    name: "Robert Chen",
    role: "CMO, Atlas Brands",
    quote: `We've used ${siteName} for three consecutive product launches. The talent quality and reliability have made them our sole booking partner.`,
    rating: 5,
  },
];

const features = [
  {
    icon: Check,
    title: "Verified & Vetted Talent",
    description: "Every artist is personally vetted. We manage contracts, riders, and compliance",
  },
  {
    icon: Shield,
    title: "Secure & Confidential",
    description: "Enterprise-grade security with NDA-backed transactions and private communications",
  },
  {
    icon: Headphones,
    title: "Dedicated Account Manager",
    description: "A single point of contact from initial enquiry through post-event follow-up",
  },
  {
    icon: Settings2,
    title: "Bespoke Experiences",
    description: "Fully tailored engagements designed around your brand, audience, and objectives",
  },
];

const faqs = [
  {
    q: "How does the booking process work?",
    a: "Submit an enquiry through our platform specifying your event details. A dedicated account manager will confirm talent availability, handle contract negotiation, and coordinate all logistics.",
  },
  {
    q: "How are celebrities vetted?",
    a: "Every talent on our roster undergoes a thorough vetting process including identity verification, contract compliance review, and professional history assessment before being listed.",
  },
  {
    q: "What is your cancellation policy?",
    a: "In the rare event of a cancellation, we offer a full refund or arrange a replacement talent of comparable stature at no additional cost. Terms are outlined in every booking agreement.",
  },
  {
    q: "How far in advance should I book?",
    a: "We recommend a minimum of 3–4 weeks for standard engagements. High-profile talent and international events may require longer lead times. Expedited bookings are available on request.",
  },
  {
    q: "Do you handle international bookings?",
    a: "Yes. We coordinate visas, travel, accommodation, and on-ground logistics for engagements across 40+ countries. Our operations team ensures a seamless experience regardless of location.",
  },
];


export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [featuredCelebs, setFeaturedCelebs] = useState<PublicCelebrity[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getPublicFeaturedCelebrities(6).then((res) => {
      if (res.success && res.data) setFeaturedCelebs(res.data);
    });
  }, []);

  return (
    <>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[85vh] lg:min-h-screen flex flex-col overflow-hidden bg-[#050505]">
          {/* Background Slideshow */}
          <div className="absolute inset-0">
            {sliderImages.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={src}
                  alt={`Celebrity experience ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </div>
            ))}
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-[#050505]/40" />
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-24 lg:pt-32 pb-16">
            <div className="max-w-2xl">
              <p
                className="text-[#C9A96E] text-sm font-medium tracking-widest uppercase animate-fade-in-up"
                style={{ animationDelay: "100ms" }}
              >
                Premium Talent Management
              </p>

              <h1
                className="mt-4 font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-[1.1] animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
              >
                World-Class Talent.{" "}
                <span className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
                  Delivered.
                </span>
              </h1>

              <p
                className="mt-5 text-base lg:text-lg text-[#A1A1AA] max-w-lg animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
              >
                We connect brands, event planners, and private clients with verified
                celebrities for appearances, performances, and bespoke engagements worldwide.
              </p>

              <div
                className="mt-8 flex flex-col sm:flex-row items-start gap-3 animate-fade-in-up"
                style={{ animationDelay: "400ms" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-8 h-12 text-sm"
                >
                  <Link href="/celebrities">Browse Talent</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 hover:bg-white/5 text-white px-8 h-12 text-sm"
                >
                  <Link href="#how-it-works">How It Works</Link>
                </Button>
              </div>

              <div
                className="mt-8 flex items-center gap-5 text-xs text-[#71717A] animate-fade-in-up"
                style={{ animationDelay: "500ms" }}
              >
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C9A96E]" />
                  NDA-Protected
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C9A96E]" />
                  200+ Verified Talent
                </span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Global Coverage
                </span>
              </div>
            </div>
          </div>

          {/* Bottom indicators */}
          <div className="relative z-20 pb-6 flex items-center justify-center gap-2">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-[#C9A96E]"
                    : "w-1.5 bg-white/25 hover:bg-white/40"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 lg:py-32 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                Our Services
              </h2>
              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
              <p className="mt-6 text-[#A1A1AA] max-w-2xl mx-auto">
                End-to-end celebrity engagement solutions for brands, agencies, and private clients
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <AnimateOnScroll
                  key={service.title}
                  delay={index * 100}
                  className="group p-6 bg-[#111111] border border-[#262626] rounded-xl hover:border-[#C9A96E]/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-4 group-hover:bg-[#C9A96E]/20 transition-colors">
                    <service.icon className="w-6 h-6 text-[#C9A96E]" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#71717A]">{service.description}</p>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Talent Section */}
        {featuredCelebs.length > 0 && (
          <section className="py-24 lg:py-32 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <AnimateOnScroll className="text-center mb-16">
                <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                  Featured Talent
                </h2>
                <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
                <p className="mt-6 text-[#A1A1AA] max-w-2xl mx-auto">
                  A selection from our exclusive roster of verified celebrities and performers
                </p>
              </AnimateOnScroll>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                {featuredCelebs.map((celeb, index) => (
                  <AnimateOnScroll
                    key={celeb._id}
                    delay={index * 80}
                    animation="fade-up"
                  >
                    <Link href={`/celebrities/${celeb.slug}`} className="group block">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#262626] group-hover:border-[#C9A96E]/50 transition-all duration-300">
                        {celeb.profileImage?.url ? (
                          <Image
                            src={celeb.profileImage.url}
                            alt={celeb.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#111111] flex items-center justify-center">
                            <Users className="w-10 h-10 text-[#333]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-display text-sm font-semibold text-[#FAFAFA] truncate">
                            {celeb.name}
                          </p>
                          <p className="text-xs text-[#C9A96E]">{celeb.category}</p>
                        </div>
                      </div>
                    </Link>
                  </AnimateOnScroll>
                ))}
              </div>

              <AnimateOnScroll className="text-center mt-12">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#C9A96E]/30 hover:bg-[#C9A96E]/10 text-[#C9A96E]"
                >
                  <Link href="/celebrities" className="inline-flex items-center gap-2">
                    View Full Roster
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </AnimateOnScroll>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-16 lg:py-20 bg-[#0a0a0a] border-y border-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <AnimateOnScroll
                  key={stat.label}
                  delay={index * 100}
                  animation="scale"
                  className="text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                    <stat.icon className="w-7 h-7 text-[#C9A96E]" />
                  </div>
                  <p className="font-display text-3xl lg:text-4xl font-bold text-[#FAFAFA]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[#71717A]">{stat.label}</p>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 lg:py-32 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                How It Works
              </h2>
              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
              <p className="mt-6 text-[#A1A1AA] max-w-2xl mx-auto">
                Three steps from enquiry to execution — we handle the rest
              </p>
            </AnimateOnScroll>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#262626] via-[#C9A96E]/30 to-[#262626]" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {steps.map((step, index) => (
                  <AnimateOnScroll
                    key={step.title}
                    delay={index * 150}
                    animation="scale"
                    className="relative text-center"
                  >
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111111] border-2 border-[#C9A96E]/30 mb-6">
                      <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#C9A96E] text-black text-sm font-bold flex items-center justify-center">
                        {step.number}
                      </span>
                      <step.icon className="w-8 h-8 text-[#C9A96E]" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#FAFAFA] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#71717A] max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experience Gallery Section */}
        <section className="py-24 lg:py-32 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                Unforgettable Experiences
              </h2>
              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
              <p className="mt-6 text-[#A1A1AA] max-w-2xl mx-auto">
                From private dinners to arena performances — every engagement is managed end-to-end
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {experienceImages.map((img, index) => (
                <AnimateOnScroll
                  key={img.label}
                  delay={index * 120}
                  animation={index % 2 === 0 ? "fade-right" : "fade-left"}
                >
                  <div className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-[#262626]">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/30 text-[#C9A96E] text-sm font-medium backdrop-blur-sm">
                        {img.label}
                      </span>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 lg:py-32 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                What Our Clients Say
              </h2>
              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
              <p className="mt-6 text-[#A1A1AA] max-w-2xl mx-auto">
                Trusted by corporate clients, agencies, and private individuals worldwide
              </p>
            </AnimateOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {getTestimonials(siteConfig.name).map((t, index) => (
                <AnimateOnScroll
                  key={t.name}
                  delay={index * 150}
                  animation="fade-up"
                  className="relative bg-[#111111] border border-[#262626] rounded-xl p-6 lg:p-8"
                >
                  <Quote className="w-8 h-8 text-[#C9A96E]/20 mb-4" />
                  <p className="text-[#A1A1AA] leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Stars key={i} className="w-4 h-4 text-[#C9A96E] fill-[#C9A96E]" />
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-[#FAFAFA] text-sm">{t.name}</p>
                    <p className="text-xs text-[#71717A]">{t.role}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="why-us" className="py-24 lg:py-32 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <AnimateOnScroll animation="fade-right">
                <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                  Why Choose
                  <br />
                  <span className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
                    {siteConfig.name}?
                  </span>
                </h2>
                <div className="mt-4 h-1 w-16 bg-gradient-to-r from-[#C9A96E] to-transparent" />

                <div className="mt-10 space-y-6">
                  {features.map((feature, index) => (
                    <AnimateOnScroll
                      key={feature.title}
                      delay={index * 100}
                      animation="fade-up"
                      className="flex gap-4"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#FAFAFA] mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-[#71717A]">
                          {feature.description}
                        </p>
                      </div>
                    </AnimateOnScroll>
                  ))}
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-left" delay={200} className="relative">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#262626]">
                  <Image
                    src="/images/experiences/event2.jpg"
                    alt="Exclusive celebrity dinner experience"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                        <p className="font-display text-2xl font-bold text-[#C9A96E]">200+</p>
                        <p className="text-xs text-[#A1A1AA] mt-1">Verified Talent</p>
                      </div>
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                        <p className="font-display text-2xl font-bold text-[#C9A96E]">98%</p>
                        <p className="text-xs text-[#A1A1AA] mt-1">Satisfaction Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#C9A96E]/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#C9A96E]/5 rounded-full blur-3xl" />
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 lg:py-32 bg-[#050505]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="text-center mb-16">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                Frequently Asked Questions
              </h2>
              <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
            </AnimateOnScroll>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <AnimateOnScroll key={index} delay={index * 80} animation="fade-up">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left bg-[#111111] border border-[#262626] rounded-xl p-5 lg:p-6 hover:border-[#C9A96E]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium text-[#FAFAFA] text-sm lg:text-base">
                        {faq.q}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-[#C9A96E] shrink-0 transition-transform duration-300 ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === index ? "max-h-40 mt-4" : "max-h-0"
                      }`}
                    >
                      <p className="text-sm text-[#71717A] leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </button>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 lg:py-32 bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/experiences/event3.jpg"
              alt="Concert background"
              fill
              className="object-cover opacity-20"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AnimateOnScroll animation="scale">
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-[#FAFAFA]">
                Let&apos;s Create Something
                <br />
                <span className="bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
                  Extraordinary
                </span>
              </h2>
              <p className="mt-6 text-lg text-[#A1A1AA] max-w-2xl mx-auto">
                Whether it&apos;s a global brand activation or a private milestone celebration —
                we deliver the talent that makes it unforgettable
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-10 h-14 text-lg"
                >
                  <Link href="/register">Start Your Enquiry</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#C9A96E]/30 hover:bg-[#C9A96E]/10 text-[#C9A96E] px-10 h-14 text-lg"
                >
                  <Link href="/celebrities">Explore Talent</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
