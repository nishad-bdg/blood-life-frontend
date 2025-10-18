import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import type { JSX } from "react"
import SignInClient from "./SignInClient"

const SignInPage = async (): Promise<JSX.Element> => {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard") // already logged in
  return <SignInClient />
}

export default SignInPage
