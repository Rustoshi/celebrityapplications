import nodemailer from "nodemailer";

/* ─── SMTP Transport (Zoho) ─── */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = process.env.SMTP_FROM_NAME || "CelebConnect";
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "CelebConnect";

/* ─── Black & White HTML Template ─── */

function buildTemplate({
  heading,
  body,
  footer,
}: {
  heading: string;
  body: string;
  footer?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111111;line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;border-bottom:2px solid #111111;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.5px;">${SITE_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 0;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111111;">${heading}</h2>
              <div style="font-size:15px;color:#333333;line-height:1.7;">
                ${body}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;border-top:1px solid #e5e5e5;">
              <p style="margin:0;font-size:12px;color:#999999;">
                ${footer || `&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.`}
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#999999;">
                This is an automated message. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Core Send Function ─── */

interface SendEmailOptions {
  to: string;
  subject: string;
  heading: string;
  body: string;
  footer?: string;
}

export async function sendEmail({ to, subject, heading, body, footer }: SendEmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[Email] SMTP not configured, skipping email to:", to);
      return false;
    }

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html: buildTemplate({ heading, body, footer }),
    });

    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/* ─── Email Templates ─── */

// ── Registration ──

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${SITE_NAME}`,
    heading: "Welcome!",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thank you for creating your account with ${SITE_NAME}. We're delighted to have you.</p>
      <p>You can now browse our exclusive roster of celebrities and submit booking requests directly from your dashboard.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

// ── Booking Notifications ──

export async function sendBookingSubmittedEmail(to: string, firstName: string, bookingId: string, celebrityName: string, type: string) {
  return sendEmail({
    to,
    subject: `Booking Request Received — ${bookingId}`,
    heading: "Booking Request Submitted",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your booking request has been received and is under review.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Booking ID</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${bookingId}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Celebrity</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${celebrityName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Type</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${type}</td></tr>
      </table>
      <p>Our team will review your request and get back to you shortly.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendBookingApprovedEmail(to: string, firstName: string, bookingId: string, amount: string) {
  return sendEmail({
    to,
    subject: `Booking Approved — ${bookingId}`,
    heading: "Booking Approved",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Great news! Your booking request <strong>${bookingId}</strong> has been approved.</p>
      <p>The total amount is <strong>${amount}</strong>. Please proceed to upload your payment receipt from your dashboard to confirm the booking.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendBookingRejectedEmail(to: string, firstName: string, bookingId: string, reason?: string) {
  return sendEmail({
    to,
    subject: `Booking Update — ${bookingId}`,
    heading: "Booking Not Approved",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Unfortunately, your booking request <strong>${bookingId}</strong> could not be approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>You are welcome to submit a new booking request at any time.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendBookingCompletedEmail(to: string, firstName: string, bookingId: string) {
  return sendEmail({
    to,
    subject: `Booking Completed — ${bookingId}`,
    heading: "Booking Completed",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your booking <strong>${bookingId}</strong> has been marked as completed. We hope you had an excellent experience.</p>
      <p>Thank you for choosing ${SITE_NAME}.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendBookingCancelledEmail(to: string, firstName: string, bookingId: string, reason?: string) {
  return sendEmail({
    to,
    subject: `Booking Cancelled — ${bookingId}`,
    heading: "Booking Cancelled",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your booking <strong>${bookingId}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you have any questions, please contact our support team.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendBookingConfirmedEmail(to: string, firstName: string, bookingId: string) {
  return sendEmail({
    to,
    subject: `Booking Confirmed — ${bookingId}`,
    heading: "Payment Confirmed",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your payment for booking <strong>${bookingId}</strong> has been verified and the booking is now confirmed.</p>
      <p>We will send you further details as the event date approaches.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

// ── Fan Card Order Notifications ──

export async function sendFanCardOrderPlacedEmail(to: string, firstName: string, orderNumber: string, cardTitle: string, amount: string) {
  return sendEmail({
    to,
    subject: `Fan Card Order Received — ${orderNumber}`,
    heading: "Order Placed",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your fan card order has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Order #</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${orderNumber}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Card</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${cardTitle}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Amount</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${amount}</td></tr>
      </table>
      <p>Please upload your payment receipt from your dashboard to proceed.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendFanCardOrderConfirmedEmail(to: string, firstName: string, orderNumber: string) {
  return sendEmail({
    to,
    subject: `Fan Card Order Confirmed — ${orderNumber}`,
    heading: "Order Confirmed",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your fan card order <strong>${orderNumber}</strong> has been confirmed. We are processing it now.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendFanCardOrderDeliveredEmail(to: string, firstName: string, orderNumber: string) {
  return sendEmail({
    to,
    subject: `Fan Card Delivered — ${orderNumber}`,
    heading: "Order Delivered",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your fan card order <strong>${orderNumber}</strong> has been delivered. Enjoy your exclusive collectible!</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendFanCardOrderCancelledEmail(to: string, firstName: string, orderNumber: string, reason?: string) {
  return sendEmail({
    to,
    subject: `Fan Card Order Cancelled — ${orderNumber}`,
    heading: "Order Cancelled",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your fan card order <strong>${orderNumber}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you have any questions, please contact our support team.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

// ── Membership Notifications ──

export async function sendMembershipAppliedEmail(to: string, firstName: string, tierName: string, cardNumber: string) {
  return sendEmail({
    to,
    subject: `Membership Application Received — ${cardNumber}`,
    heading: "Application Submitted",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your membership application has been received.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Tier</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${tierName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600;">Card #</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${cardNumber}</td></tr>
      </table>
      <p>Please upload your payment receipt to proceed. Our team will review and activate your membership shortly.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendMembershipApprovedEmail(to: string, firstName: string, tierName: string, cardNumber: string) {
  return sendEmail({
    to,
    subject: `Membership Activated — ${cardNumber}`,
    heading: "Membership Activated",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Congratulations! Your <strong>${tierName}</strong> membership has been activated.</p>
      <p>Your membership card number is <strong>${cardNumber}</strong>. You now have access to all the exclusive benefits of your tier.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendMembershipRejectedEmail(to: string, firstName: string, tierName: string, reason?: string) {
  return sendEmail({
    to,
    subject: `Membership Application Update`,
    heading: "Application Not Approved",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Unfortunately, your application for the <strong>${tierName}</strong> membership could not be approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>You are welcome to reapply at any time.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendMembershipCancelledEmail(to: string, firstName: string, tierName: string, reason?: string) {
  return sendEmail({
    to,
    subject: `Membership Cancelled`,
    heading: "Membership Cancelled",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your <strong>${tierName}</strong> membership has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you have any questions, please contact our support team.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

// ── Password Reset ──

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: `Reset Your Password — ${SITE_NAME}`,
    heading: "Password Reset Request",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background-color:#111111;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;border:1px solid #333333;">Reset Password</a>
      </p>
      <p style="font-size:13px;color:#666666;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size:13px;color:#666666;word-break:break-all;">${resetUrl}</p>
      <p style="margin-top:16px;font-size:13px;color:#666666;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  return sendEmail({
    to,
    subject: `Password Changed — ${SITE_NAME}`,
    heading: "Password Updated",
    body: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your password has been successfully changed. If you did not make this change, please contact our support team immediately.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}

// ── Contact Message Auto-Reply ──

export async function sendContactAutoReply(to: string, name: string, subject: string) {
  return sendEmail({
    to,
    subject: `We received your message — "${subject}"`,
    heading: "Message Received",
    body: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for reaching out to us. We have received your message regarding "<strong>${subject}</strong>" and our team will review it shortly.</p>
      <p>We typically respond within 24–48 business hours.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The ${SITE_NAME} Team</strong></p>
    `,
  });
}
