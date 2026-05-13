import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";
import { format } from "date-fns";

/**
 * Merges class names using clsx and tailwind-merge for optimal Tailwind CSS class handling
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-safe slug from a given string
 */
export function generateSlug(name: string): string {
  return slugifyLib(name, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generates a unique booking ID in format: BK-YYYYMMDD-XXXX
 */
export function generateBookingId(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${dateStr}-${randomPart}`;
}

/**
 * Formats a number as USD currency with $ symbol, commas, and 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date as "May 12, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

/**
 * Formats a date and time as "May 12, 2026 at 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy 'at' h:mm a");
}

/**
 * Returns initials from first and optional last name (e.g., "JD" from "John" "Doe")
 */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${first}${last}`;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Delays execution for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if a value is a valid email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a unique fan card number in format: FC-YYYYMMDD-XXXX
 */
export function generateFanCardNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FC-${dateStr}-${randomPart}`;
}

/**
 * Generates a unique fan card order number in format: FCO-YYYYMMDD-XXXX
 */
export function generateFanCardOrderNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FCO-${dateStr}-${randomPart}`;
}

/**
 * Generates a unique membership card number in format: MC-YYYYMMDD-XXXX
 */
export function generateMembershipNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MC-${dateStr}-${randomPart}`;
}
