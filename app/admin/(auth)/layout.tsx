import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface AdminAuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for admin authentication pages.
 * Centered card layout with luxury aesthetic.
 */
export default function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A96E]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#C9A96E]/3 rounded-full blur-[100px]" />
      </div>

      {/* Brand */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold tracking-tight">
            {APP_NAME}
          </h1>
        </Link>
        <div className="h-px w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20">
          <Shield className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span className="text-xs font-medium text-[#C9A96E] uppercase tracking-wider">
            Admin Portal
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

      {/* Back to home link */}
      <div className="relative z-10 mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </main>
  );
}
