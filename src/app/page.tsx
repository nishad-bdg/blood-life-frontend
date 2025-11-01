import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { JSX } from "react"
import SignInClient from "./signin/SignInClient"

const SignInPage = async () => {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard") // already logged in
  return <SignInClient />
}

export default SignInPage
