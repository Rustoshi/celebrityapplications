import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for authentication pages (login, register, forgot-password).
 * Centered card layout with luxury aesthetic.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A96E]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#C9A96E]/3 rounded-full blur-[100px]" />
      </div>

      {/* Brand */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold tracking-tight">
            {APP_NAME}
          </h1>
        </Link>
        <div className="h-px w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
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
