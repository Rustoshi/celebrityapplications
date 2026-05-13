import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;

      const isClientDashboard = pathname.startsWith("/dashboard");
      const isAdminPanel =
        pathname.startsWith("/admin/dashboard") ||
        pathname.startsWith("/admin/celebrities") ||
        pathname.startsWith("/admin/bookings") ||
        pathname.startsWith("/admin/clients") ||
        pathname.startsWith("/admin/payment-methods") ||
        pathname.startsWith("/admin/messages") ||
        pathname.startsWith("/admin/settings");
      const isClientAuthPage = pathname === "/login" || pathname === "/register";
      const isAdminAuthPage = pathname === "/admin/login";

      if (isClientDashboard) {
        if (!isLoggedIn || userRole !== "client") {
          return false;
        }
        return true;
      }

      if (isAdminPanel) {
        if (!isLoggedIn || userRole !== "admin") {
          return false;
        }
        return true;
      }

      if (isClientAuthPage && isLoggedIn && userRole === "client") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (isAdminAuthPage && isLoggedIn && userRole === "admin") {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
