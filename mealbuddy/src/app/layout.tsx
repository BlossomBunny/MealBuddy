import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import BottomNav from "@/components/BottomNav";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "🍽️ Family Meal Planner",
  description: "Plan meals, track ingredients, and cook together as a family!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meal Planner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f97316",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = cookies().get("mb_user")?.value;

  return (
    <html lang="en">
      <body>
        <main className="max-w-md mx-auto min-h-screen pb-nav">
          {children}
        </main>
        {user && <BottomNav />}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontWeight: "600",
            },
          }}
        />
      </body>
    </html>
  );
}
