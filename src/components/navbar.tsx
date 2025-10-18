"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { JSX } from "react"

const Navbar = (): JSX.Element => {
  const { data } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async (): Promise<void> => {
    await signOut({ redirect: false })
    router.push("/signin")
  }

  const isActive = (href: string): string =>
    pathname === href
      ? "text-primary font-medium"
      : "text-muted-foreground hover:text-foreground"

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            BloodDonor Admin
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/(admin)/dashboard"
              className={`text-sm ${isActive("/(admin)/dashboard")}`}
            >
              Dashboard
            </Link>
            <Link
              href="/(admin)/users"
              className={`text-sm ${isActive("/(admin)/users")}`}
            >
              Users
            </Link>
            <Link
              href="/(admin)/donations"
              className={`text-sm ${isActive("/(admin)/donations")}`}
            >
              Donations
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground md:inline-block">
            {(data as any)?.phone ?? ""}
          </span>
          <Button
            size="sm"
            variant="destructive"
            className="text-destructive-foreground"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
