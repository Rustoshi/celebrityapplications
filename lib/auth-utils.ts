import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin, User } from "@/lib/models";

/**
 * Get the current session
 * @returns The session object or null if not authenticated
 */
export async function getSession() {
  const session = await auth();
  return session;
}

/**
 * Require admin authentication
 * Redirects to /admin/login if not authenticated as admin
 * @returns The session object
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    redirect("/admin/login");
  }

  return session;
}

/**
 * Require client authentication
 * Redirects to /login if not authenticated as client
 * @returns The session object
 */
export async function requireClient() {
  const session = await auth();

  if (!session || session.user?.role !== "client") {
    redirect("/login");
  }

  return session;
}

/**
 * Get the current admin document from the database
 * Redirects to /admin/login if not found
 * @returns The admin document (without password)
 */
export async function getCurrentAdmin() {
  const session = await requireAdmin();

  await connectDB();

  const admin = await Admin.findById(session.user.id).select("-password");

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

/**
 * Get the current user document from the database
 * Redirects to /login if not found or suspended
 * @returns The user document (without password)
 */
export async function getCurrentUser() {
  const session = await requireClient();

  await connectDB();

  const user = await User.findById(session.user.id).select("-password");

  if (!user || user.status === "suspended") {
    redirect("/login");
  }

  return user;
}

/**
 * Check if the current request is authenticated
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated() {
  const session = await auth();
  return !!session;
}

/**
 * Get the role of the current user
 * @returns The user role or null if not authenticated
 */
export async function getUserRole() {
  const session = await auth();
  return session?.user?.role || null;
}
