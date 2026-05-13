import { getCurrentAdmin } from "@/lib/auth-utils";
import AdminShell from "@/components/admin/AdminShell";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for admin panel pages.
 * Protected route - requires admin authentication.
 */
export default async function AdminPanelLayout({
  children,
}: AdminPanelLayoutProps) {
  const admin = await getCurrentAdmin();

  const serializedAdmin = {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    role: admin.role,
    avatar: admin.avatar || "",
  };

  return <AdminShell admin={serializedAdmin}>{children}</AdminShell>;
}
