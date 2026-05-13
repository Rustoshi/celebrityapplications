import { Mail, Phone, MapPin, Clock } from "lucide-react";

import { getPublicSiteSettings } from "@/lib/actions/public/settings";
import ContactForm from "@/components/public/ContactForm";
import { siteConfig, pageTitle } from "@/lib/site-config";

export const metadata = {
  title: pageTitle("Contact Us"),
  description: `Get in touch with ${siteConfig.name}. We'd love to hear from you.`,
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
            Get In Touch
          </h1>
          <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          <p className="mt-6 text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            Have a question or want to learn more about our services? We&apos;d love
            to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold text-[#FAFAFA] mb-6">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {settings.contactEmail && (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#71717A] mb-1">Email</p>
                        <a
                          href={`mailto:${settings.contactEmail}`}
                          className="text-[#FAFAFA] hover:text-[#C9A96E] transition-colors"
                        >
                          {settings.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {settings.contactPhone && (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#71717A] mb-1">Phone</p>
                        <a
                          href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                          className="text-[#FAFAFA] hover:text-[#C9A96E] transition-colors"
                        >
                          {settings.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {(settings.contactAddress || settings.contactCity) && (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#71717A] mb-1">Address</p>
                        <p className="text-[#FAFAFA]">
                          {settings.contactAddress && (
                            <>
                              {settings.contactAddress}
                              <br />
                            </>
                          )}
                          {settings.contactCity}
                        </p>
                      </div>
                    </div>
                  )}

                  {settings.businessHours && (
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#71717A] mb-1">Business Hours</p>
                        <p className="text-[#FAFAFA]">{settings.businessHours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(settings.socialLinks?.instagram || settings.socialLinks?.twitter || settings.socialLinks?.facebook || settings.socialLinks?.tiktok || settings.socialLinks?.youtube) && (
                <div className="bg-[#111111] border border-[#262626] rounded-xl p-6 lg:p-8">
                  <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-4">
                    Follow Us
                  </h3>
                  <div className="flex items-center gap-4">
                    {settings.socialLinks?.instagram && (
                      <a
                        href={settings.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#71717A] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
                        aria-label="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                    {settings.socialLinks?.twitter && (
                      <a
                        href={settings.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#71717A] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
                        aria-label="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {settings.socialLinks?.facebook && (
                      <a
                        href={settings.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#71717A] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
                        aria-label="Facebook"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                    )}
                    {settings.socialLinks?.tiktok && (
                      <a
                        href={settings.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#71717A] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
                        aria-label="TikTok"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                      </a>
                    )}
                    {settings.socialLinks?.youtube && (
                      <a
                        href={settings.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#71717A] hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition-colors"
                        aria-label="YouTube"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
