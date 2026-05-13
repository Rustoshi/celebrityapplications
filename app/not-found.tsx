import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#050505] relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#C9A96E]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#C9A96E]/5 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg">
        {/* 404 */}
        <h1 className="font-display text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
          404
        </h1>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#FAFAFA]">
            Page Not Found
          </h2>
          <p className="text-[#A1A1AA]">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium px-8"
          >
            <Link href="/">Go Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-[#262626] hover:bg-[#111111] px-8"
          >
            <Link href="/celebrities">Browse Celebrities</Link>
          </Button>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute bottom-8 text-center">
        <Link
          href="/"
          className="font-display text-lg font-semibold bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent"
        >
          {siteConfig.name}
        </Link>
      </div>
    </main>
  );
}
