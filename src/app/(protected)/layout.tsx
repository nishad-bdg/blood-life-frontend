import { JSX, ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Navbar from "@/components/navbar"


const AdminLayout = async ({
  children,
}: {
  children: ReactNode
}): Promise<JSX.Element> => {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/signin")
  }

  const roles = (session as any).roles as string[] | undefined
  const isAdmin = Array.isArray(roles) && roles.includes("admin")

  if (!isAdmin) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}

export default AdminLayout
