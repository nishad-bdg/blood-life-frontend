import NextAuth, { type NextAuthOptions, type Session, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface Creds {
  phone: string;
  password: string;
}

export enum RoleEnum {
  ADMIN = "admin",
  CO_ADMIN = "co-admin",
  MODERATOR = "moderator",
  USER = "donar",
}

type AuthUser = User & {
  accessToken?: string;
  phone?: string;
  roles?: RoleEnum[];
};

type AppJWT = JWT & {
  accessToken?: string;
  phone?: string;
  roles?: RoleEnum[];
  userId?: string;
};

type AppSession = Session & {
  accessToken?: string;
  phone?: string;
  roles?: RoleEnum[];
  userId?: string;
};

interface LoginResponse {
  payload?: { phone?: string; sub?: string; roles?: string[] };
  accessToken?: string;
}

function mapRole(r: string): RoleEnum | undefined {
  const v = r.toLowerCase();
  if (v === "admin") return RoleEnum.ADMIN;
  if (v === "co-admin" || v === "co_admin" || v === "coadmin") return RoleEnum.CO_ADMIN;
  if (v === "moderator") return RoleEnum.MODERATOR;
  if (v === "user" || v === "donor" || v === "donar") return RoleEnum.USER;
  return undefined;
}

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

          const data: LoginResponse = await res.json();
          const accessToken = data?.accessToken;
          const sub = data?.payload?.sub;
          const phone = data?.payload?.phone;
          const rolesRaw = data?.payload?.roles ?? [];

          if (!accessToken || !sub || !phone) return null;

          const roles = rolesRaw
            .map((r) => mapRole(r))
            .filter((r): r is RoleEnum => Boolean(r));

          // ✅ Allow only Admins
          if (!roles.includes(RoleEnum.ADMIN)) {
            console.warn("Access denied: non-admin attempted login", { phone });
            return null; // returning null denies login
          }

          const user: AuthUser = {
            id: sub,
            phone,
            roles,
            accessToken,
            name: undefined,
            email: undefined,
            image: undefined,
          };

          return user;
        } catch {
          return null;
        }
      }

    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser | null }): Promise<JWT> {
      const t = token as AppJWT;
      if (user) {
        t.accessToken = user.accessToken;
        t.phone = user.phone;
        t.roles = user.roles;
        t.userId = typeof user.id === "string" ? user.id : undefined;
      }
      return t;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const s = session as AppSession;
      const t = token as AppJWT;
      s.accessToken = t.accessToken;
      s.phone = t.phone;
      s.roles = t.roles;
      s.userId = t.userId;
      return s;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
