"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Flag,
  Trophy,
  Medal,
  LogOut,
  Menu,
  X,
  User,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { LeagueSwitcher } from "@/components/league-switcher"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/races", label: "Races", icon: Flag },
  { href: "/wdc", label: "WDC", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/how-it-works", label: "How it works", icon: HelpCircle },
]

export function Nav({
  playerName,
  groupName,
  avatarUrl,
}: {
  playerName: string
  groupName: string
  avatarUrl?: string
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = playerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" })
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-primary"
        >
          <Flag className="h-5 w-5" />
          <span className="hidden sm:inline">GRID PROPHET</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" role="navigation" aria-label="Main navigation">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <LeagueSwitcher currentGroupName={groupName} />
          </div>

          {/* Profile avatar link */}
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 rounded-full p-0.5 transition-colors hover:ring-2 hover:ring-primary/40",
              pathname === "/profile" && "ring-2 ring-primary"
            )}
            aria-label="View profile"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={playerName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            <span className="hidden text-sm font-medium text-foreground lg:inline">
              {playerName}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
          <div className="mb-3 flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={playerName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{playerName}</p>
              <p className="text-xs text-muted-foreground">{groupName}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1" role="navigation" aria-label="Mobile navigation">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/profile"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
