import { Metadata } from "next";
import { format } from "date-fns";

import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/lib/models";
import { siteConfig, pageTitle } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle("Privacy Policy"),
  description: `Learn how ${siteConfig.name} collects, uses, and protects your personal information.`,
};

const defaultPrivacy = `
## 1. Information We Collect

### 1.1 Information You Provide
We collect information you provide directly to us, including:
- Account information (name, email, phone number, password)
- Profile information (date of birth, gender, location, bio)
- Payment information (processed securely through our payment providers)
- Booking details and preferences
- Communications with us or celebrities

### 1.2 Information Collected Automatically
When you use our Platform, we automatically collect:
- Device information (IP address, browser type, operating system)
- Usage data (pages visited, features used, time spent)
- Cookies and similar tracking technologies

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process bookings and payments
- Communicate with you about your account and bookings
- Send promotional communications (with your consent)
- Detect, prevent, and address fraud and security issues
- Comply with legal obligations

## 3. Information Sharing

We may share your information with:
- Celebrities and their representatives (for booking purposes)
- Payment processors and service providers
- Legal authorities when required by law
- Business partners with your consent

We do not sell your personal information to third parties.

## 4. Data Security

We implement industry-standard security measures to protect your information, including:
- Encryption of data in transit and at rest
- Regular security assessments
- Access controls and authentication
- Secure data centers

However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.

## 5. Cookies and Tracking

We use cookies and similar technologies to:
- Remember your preferences
- Analyze Platform usage
- Personalize your experience
- Provide targeted advertising

You can control cookies through your browser settings, but disabling them may affect Platform functionality.

## 6. Your Rights

Depending on your location, you may have the right to:
- Access your personal information
- Correct inaccurate data
- Delete your account and data
- Object to certain processing
- Data portability
- Withdraw consent

To exercise these rights, please contact us at privacy@celebconnect.com.

## 7. Children's Privacy

Our Platform is not intended for children under 18. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.

## 8. International Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.

## 9. Data Retention

We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account at any time.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the Platform.

## 11. Contact Us

For questions about this Privacy Policy or our data practices, please contact us at:
- Email: privacy@celebconnect.com
- Address: 123 Celebrity Lane, Los Angeles, CA 90001
`;

export default async function PrivacyPage() {
  await connectDB();

  const settings = await SiteSettings.findOrCreate();
  const content = settings.privacyPolicy || defaultPrivacy;
  const lastUpdated = settings.updatedAt || new Date();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
            Privacy Policy
          </h1>
          <div className="mt-4 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent" />
          <p className="mt-6 text-[#A1A1AA]">
            Last updated: {format(new Date(lastUpdated), "MMMM d, yyyy")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-16 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="space-y-6 text-[#A1A1AA]">
              {content.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      className="font-display text-xl font-semibold text-[#FAFAFA] mt-8 mb-4"
                    >
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3
                      key={index}
                      className="font-medium text-[#FAFAFA] mt-6 mb-2"
                    >
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  const items = paragraph.split("\n").filter((line) => line.startsWith("- "));
                  return (
                    <ul key={index} className="list-disc pl-6 space-y-1">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace("- ", "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
