import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Admin, User } from "@/lib/models";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.loginType) {
          throw new Error("Missing credentials");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const loginType = credentials.loginType as string;

        await connectDB();

        if (loginType === "admin") {
          const admin = await Admin.findOne({ email: email.toLowerCase() });

          if (!admin || !admin.isActive) {
            throw new Error("Invalid credentials");
          }

          const isPasswordValid = await bcrypt.compare(password, admin.password);

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

          return {
            id: admin._id.toString(),
            email: admin.email,
            name: `${admin.firstName} ${admin.lastName}`,
            role: "admin",
            image: admin.avatar || null,
          };
        }

        if (loginType === "client") {
          const user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          if (user.status === "suspended") {
            throw new Error("Account suspended");
          }

          if (user.status === "pending") {
            throw new Error("Account pending approval");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: "client",
            image: user.avatar?.url || null,
          };
        }

        throw new Error("Invalid login type");
      },
    }),
  ],
});
