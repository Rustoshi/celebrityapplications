import { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth-utils";
import DashboardShell from "@/components/dashboard/DashboardShell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  const serializedUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar ? { url: user.avatar.url } : undefined,
  };

  return <DashboardShell user={serializedUser}>{children}</DashboardShell>;
}
