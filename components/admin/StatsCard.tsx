"use client";

import {
  TrendingUp,
  TrendingDown,
  Stars,
  CalendarCheck,
  Users,
  DollarSign,
  MessageSquare,
  Briefcase,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  stars: Stars,
  calendar: CalendarCheck,
  users: Users,
  dollar: DollarSign,
  message: MessageSquare,
  briefcase: Briefcase,
  creditCard: CreditCard,
  settings: Settings,
} as const;

type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconName;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className={cn(
        "p-6 rounded-lg bg-[#111111] border border-[#262626] hover:border-[#404040] transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[#A1A1AA] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#FAFAFA]">{value}</p>
          {description && (
            <p className="text-xs text-[#71717A] mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#C9A96E]/20">
          <Icon className="w-5 h-5 text-[#C9A96E]" />
        </div>
      </div>
    </div>
  );
}
