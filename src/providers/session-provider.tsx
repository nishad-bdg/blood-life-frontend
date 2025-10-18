"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode, JSX } from "react"

interface Props {
  children: ReactNode
}

const AuthSessionProvider = ({ children }: Props): JSX.Element => {
  return <SessionProvider>{children}</SessionProvider>
}

export default AuthSessionProvider
