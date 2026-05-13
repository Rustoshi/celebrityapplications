import { Metadata } from "next";
import { format } from "date-fns";

import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/lib/models";
import { siteConfig, pageTitle } from "@/lib/site-config";

export const metadata: Metadata = {
  title: pageTitle("Refund Policy"),
  description: `Understand our refund and cancellation policies for celebrity bookings at ${siteConfig.name}.`,
};

const getDefaultRefundPolicy = (siteName: string) => `
## 1. Overview

At ${siteName}, we strive to ensure every booking experience exceeds your expectations. This Refund Policy outlines the terms and conditions for refunds and cancellations.

## 2. Eligibility for Refunds

### 2.1 Celebrity Cancellation
If a celebrity cancels a confirmed booking, you are entitled to:
- A full refund of the booking amount, OR
- The option to reschedule with the same celebrity (subject to availability), OR
- Credit towards a booking with another celebrity

### 2.2 User Cancellation
Refund eligibility for user-initiated cancellations depends on the timing:

**More than 30 days before the event:**
- Full refund minus a 5% administrative fee

**15-30 days before the event:**
- 75% refund of the booking amount

**7-14 days before the event:**
- 50% refund of the booking amount

**Less than 7 days before the event:**
- No refund available

### 2.3 Exceptional Circumstances
We may consider refunds outside these guidelines for:
- Medical emergencies (with documentation)
- Natural disasters or force majeure events
- Significant changes to the booking by the celebrity

## 3. Refund Process

### 3.1 How to Request a Refund
To request a refund:
1. Log into your ${siteName} account
2. Navigate to your booking
3. Click "Request Cancellation" or "Request Refund"
4. Provide the reason for your request
5. Submit any required documentation

### 3.2 Processing Time
- Refund requests are reviewed within 3-5 business days
- Approved refunds are processed within 7-10 business days
- Refunds are issued to the original payment method

## 4. Non-Refundable Items

The following are non-refundable:
- Service fees and platform charges
- Bookings marked as "Non-Refundable" at the time of purchase
- Completed bookings
- No-shows without prior cancellation
- Bookings cancelled less than 7 days before the event

## 5. Cancellation Fees

### 5.1 Standard Cancellation Fee
A 5% administrative fee applies to all refunds processed more than 30 days before the event.

### 5.2 Late Cancellation
Cancellations made within 30 days of the event are subject to the tiered refund structure outlined in Section 2.2.

### 5.3 Payment Processing Fees
Original payment processing fees (typically 2-3%) are non-refundable.

## 6. Rescheduling

### 6.1 Rescheduling Option
Instead of a refund, you may request to reschedule your booking:
- Subject to celebrity availability
- Must be requested at least 7 days before the original date
- One free reschedule per booking
- Additional reschedules may incur fees

### 6.2 Rescheduling Deadline
Rescheduled bookings must occur within 6 months of the original booking date.

## 7. Disputes

If you disagree with a refund decision:
1. Contact our support team within 14 days
2. Provide additional documentation if available
3. Our team will review and respond within 5 business days

## 8. Special Booking Types

### 8.1 Video Calls
- Cancellations must be made at least 24 hours in advance
- Technical issues on our end qualify for full refund or reschedule

### 8.2 Live Events
- Subject to standard cancellation policy
- Venue-related cancellations may have additional terms

### 8.3 Brand Endorsements
- Custom cancellation terms apply
- Discussed during booking confirmation

## 9. Contact Us

For refund inquiries or assistance:
- Email: refunds@celebconnect.com
- Phone: +1 (555) 123-4567
- Hours: Monday-Friday, 9:00 AM - 6:00 PM EST

Our team is committed to resolving all refund requests fairly and promptly.
`;

export default async function RefundPage() {
  await connectDB();

  const settings = await SiteSettings.findOrCreate();
  const content = settings.refundPolicy || getDefaultRefundPolicy(siteConfig.name);
  const lastUpdated = settings.updatedAt || new Date();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#FAFAFA]">
            Refund Policy
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
                if (paragraph.startsWith("**")) {
                  return (
                    <p key={index} className="font-medium text-[#FAFAFA]">
                      {paragraph.replace(/\*\*/g, "")}
                    </p>
                  );
                }
                if (paragraph.match(/^\d+\./)) {
                  const items = paragraph.split("\n").filter((line) => line.match(/^\d+\./));
                  return (
                    <ol key={index} className="list-decimal pl-6 space-y-1">
                      {items.map((item, i) => (
                        <li key={i}>{item.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ol>
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
