import { Metadata } from "next";
import { format } from "date-fns";

import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/lib/models";
import { siteConfig, pageTitle } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle("Terms of Service"),
  description: `Read the terms of service for using ${siteConfig.name}, the premier celebrity booking platform.`,
};

const getDefaultTerms = (siteName: string) => `
## 1. Acceptance of Terms

By accessing or using ${siteName} ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.

## 2. Description of Services

${siteName} provides a platform that connects users with celebrities for various booking experiences, including but not limited to dinner dates, video calls, live performances, private events, and brand endorsements.

## 3. User Accounts

### 3.1 Registration
To access certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.

### 3.2 Account Security
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.

## 4. Booking Terms

### 4.1 Booking Requests
All booking requests are subject to celebrity availability and approval. Submitting a booking request does not guarantee confirmation.

### 4.2 Pricing
Prices displayed on the Platform are indicative and may vary based on specific requirements. Final pricing will be confirmed before payment.

### 4.3 Confirmation
A booking is only confirmed once payment has been received and processed, and you have received a confirmation notification from ${siteName}.

## 5. Payments

### 5.1 Payment Methods
We accept various payment methods as displayed on the Platform. All payments must be made in full before the scheduled booking date.

### 5.2 Currency
All prices are displayed in USD unless otherwise specified.

### 5.3 Taxes
Prices may not include applicable taxes, which will be added to your total where required by law.

## 6. Cancellations and Refunds

### 6.1 User Cancellations
Cancellation policies vary by booking type and celebrity. Please refer to our Refund Policy for detailed information.

### 6.2 Celebrity Cancellations
In the event a celebrity cancels a confirmed booking, you will receive a full refund or the option to reschedule.

## 7. User Conduct

You agree not to:
- Use the Platform for any unlawful purpose
- Harass, abuse, or harm celebrities or other users
- Provide false or misleading information
- Attempt to circumvent the Platform to contact celebrities directly
- Share or distribute content from bookings without consent

## 8. Intellectual Property

All content on the Platform, including text, graphics, logos, and software, is the property of ${siteName} or its licensors and is protected by intellectual property laws.

## 9. Privacy

Your use of the Platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

## 10. Limitation of Liability

To the maximum extent permitted by law, ${siteName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.

## 11. Indemnification

You agree to indemnify and hold harmless ${siteName}, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.

## 12. Modifications

We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.

## 13. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.

## 14. Contact Information

For questions about these Terms, please contact us at:
- Email: legal@celebconnect.com
- Address: 123 Celebrity Lane, Los Angeles, CA 90001
`;

export default async function TermsPage() {
  await connectDB();

  const settings = await SiteSettings.findOrCreate();
  const content = settings.termsOfService || getDefaultTerms(siteConfig.name);
  const lastUpdated = settings.updatedAt || new Date();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
            Terms of Service
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
