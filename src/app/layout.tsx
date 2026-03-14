import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Date Match",
  description: "A compatibility-first dating product focused on slower, higher-quality matching.",
};

const navItems = [
  { href: "/auth/signin", label: "登录" },
  { href: "/auth/signup", label: "注册" },
  { href: "/onboarding/profile", label: "Onboarding" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/match/current", label: "Match" },
  { href: "/admin", label: "Admin" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f6efe7] text-[#201a17] antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(246,239,231,0.95)_40%,_rgba(239,229,220,0.98))]">
          <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2b211f] text-sm font-semibold text-white">
                  DM
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#8b5e63]">Date Match</p>
                  <p className="text-sm text-[#5f514c]">Compatibility-first dating MVP</p>
                </div>
              </Link>

              <nav className="flex flex-wrap gap-2 text-sm text-[#5f514c]">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-4 py-2 transition hover:bg-[#f3ebe4] hover:text-[#201a17]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
