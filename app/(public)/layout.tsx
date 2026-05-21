import { auth } from "@/lib/auth";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const session = await auth();
  const userRole = session?.user?.role ?? null;

  return (
    <>
      <Navbar userRole={userRole} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
