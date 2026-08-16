import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulse - Incident Management",
  description: "Real-time incident management for engineering teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900`}>
        <Navbar user={user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null} />
        <main className="container mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
