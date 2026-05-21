"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
];

interface NavbarProps {
  userRole?: string | null;
}

export default function Navbar({ userRole }: NavbarProps) {
  const isLoggedIn = !!userRole;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);


  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          isScrolled
            ? "bg-[#050505]/90 backdrop-blur-lg border-b border-[#262626]/50"
            : "bg-[#050505]/80 backdrop-blur-md lg:bg-transparent border-b border-[#262626]/30 lg:border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Brand */}
            <Link href="/" className="flex items-center">
              <span className="font-display text-2xl font-bold bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
                {siteConfig.name}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                isAdmin ? (
                  <Button asChild className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
                    <Link href="/admin/dashboard">Admin Panel</Link>
                  </Button>
                ) : (
                  <Button asChild className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                )
              ) : (
                <>
                  <Button asChild variant="ghost" className="text-[#FAFAFA]">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -mr-2 text-[#FAFAFA] active:bg-[#262626] rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - rendered as sibling to header, not inside it */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute top-0 right-0 h-full w-[300px] bg-[#0a0a0a] border-l border-[#262626]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[#262626]">
                <span className="font-display text-xl font-bold bg-gradient-to-r from-[#C9A96E] to-[#E8D5B5] bg-clip-text text-transparent">
                  {siteConfig.name}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-[#FAFAFA] active:bg-[#262626] rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-[#A1A1AA] active:text-[#FAFAFA] active:bg-[#111111] rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="p-4 border-t border-[#262626] space-y-3">
                {isLoggedIn ? (
                  isAdmin ? (
                    <Button
                      asChild
                      className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/admin/dashboard">Admin Panel</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  )
                ) : (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-[#262626]"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-[#C9A96E] hover:bg-[#D4B87A] text-black"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
