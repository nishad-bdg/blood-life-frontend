import NextAuth, { type NextAuthOptions, type Session, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// What your credentials look like
interface Creds {
  phone: string;
  password: string;
}

// Extra fields you store on the user and token
type AuthUser = User & { accessToken?: string; phone?: string };
type AppJWT = JWT & { accessToken?: string; phone?: string };
type AppSession = Session & { accessToken?: string; phone?: string };

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          const c = credentials as Partial<Creds> | null;
          if (!c?.phone || !c?.password) return null;

          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: c.phone, password: c.password }),
          });

          if (!res.ok) return null;
          const data: { accessToken?: string } = await res.json();
          if (!data?.accessToken) return null;

          // Return a typed user object for the JWT callback
          const user: AuthUser = {
            id: "self",
            phone: c.phone,
            accessToken: data.accessToken,
            name: undefined,
            email: undefined,
            image: undefined,
          };
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser | null }): Promise<JWT> {
      const t = token as AppJWT;
      if (user?.accessToken) {
        t.accessToken = user.accessToken;
        t.phone = user.phone;
      }
      return t;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const s = session as AppSession;
      const t = token as AppJWT;
      s.accessToken = t.accessToken;
      s.phone = t.phone;
      return s;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
