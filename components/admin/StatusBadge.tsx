"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUSES } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  type?: "booking" | "user" | "message";
  className?: string;
}

const userStatusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  suspended: "bg-red-500/10 text-red-500 border-red-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const messageStatusColors: Record<string, string> = {
  unread: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  read: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  replied: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-[#71717A]/10 text-[#71717A] border-[#71717A]/20",
};

export default function StatusBadge({
  status,
  type = "booking",
  className,
}: StatusBadgeProps) {
  const formatLabel = (str: string) => {
    return str
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getColorClass = () => {
    if (type === "user") {
      return userStatusColors[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }

    if (type === "message") {
      return messageStatusColors[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }

    const bookingStatus = BOOKING_STATUSES.find((s) => s.value === status);
    if (bookingStatus) {
      return bookingStatus.color;
    }

    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium text-xs border",
        getColorClass(),
        className
      )}
    >
      {formatLabel(status)}
    </Badge>
  );
}
