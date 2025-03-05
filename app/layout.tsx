import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils"
import { NotesDrawer } from "@/components/@components/notes/NotesDrawer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MoneyApp",
    template: "MoneyApp | %s"
  },
  description: "Application de gestion familiale",
  icons: {
    icon: [
      {
        url: "/logo-removebg-preview.png",
        type: "image/png",
        sizes: "180x180"
      },
      {
        url: "/favicon.ico",
        type: "image/x-icon",
        sizes: "32x32"
      }
    ],
    apple: [
      {
        url: "/logo-removebg-preview.png",
        type: "image/png",
        sizes: "180x180"
      }
    ],
    shortcut: ["/favicon.ico"]
  },
  themeColor: "#0ea5e9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MoneyApp"
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geistSans.variable, geistMono.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <NotesDrawer />
        </ThemeProvider>
      </body>
    </html>
  );
}
