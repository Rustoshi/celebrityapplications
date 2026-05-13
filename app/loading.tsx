import { siteConfig } from "@/lib/site-config";

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
      {/* Logo */}
      <div className="text-center space-y-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent animate-pulse">
          {siteConfig.name}
        </h1>

        {/* Loading Dots */}
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#C9A96E] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>

        <p className="text-sm text-[#71717A]">Loading...</p>
      </div>
    </main>
  );
}
