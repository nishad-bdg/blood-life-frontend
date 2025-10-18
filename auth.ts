import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";
import { RoleEnum } from "@/app/enums/index.enum";


type Role = RoleEnum;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Role ranking logic
const roleRank: Record<Role, number> = {
  [RoleEnum.USER]: 1,
  [RoleEnum.MODERATOR]: 2,
  [RoleEnum.CO_ADMIN]: 3,
  [RoleEnum.ADMIN]: 4,
};

const hasAtLeast = (roles: string[] | undefined, min: Role) =>
  Array.isArray(roles) &&
  roles.some((r) => roleRank[r as Role] >= roleRank[min]);

const isPublic = (pathname: string) =>
  pathname === "/" ||
  pathname.startsWith("/signin") ||
  pathname.startsWith("/api/auth") ||
  pathname.startsWith("/public");

const ROUTE_RULES: Array<{ test: (p: string) => boolean; minRole: Role }> = [
  { test: (p) => p.startsWith("/admin") || p.startsWith("/api/admin"), minRole: RoleEnum.CO_ADMIN },
  { test: (p) => p.startsWith("/moderation") || p.startsWith("/api/mod"), minRole: RoleEnum.MODERATOR },
  { test: (p) => p.startsWith("/dashboard") || p.startsWith("/app"), minRole: RoleEnum.USER },
];

const matchRule = (pathname: string) => ROUTE_RULES.find((r) => r.test(pathname));

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const { data } = await api.post("/auth/login", {
          phone: credentials.phone,
          password: credentials.password,
        });

        if (!data?.accessToken || !data?.user) return null;

        const roles: string[] =
          data.user.roles ??
          (data.user.role ? [data.user.role] : [RoleEnum.USER]);

        return {
          id: data.user.id ?? data.user._id ?? data.user.userId,
          name: data.user.name,
          email: data.user.phone ?? undefined,
          roles,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = (user as any).id;
        token.roles = (user as any).roles;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      if (trigger === "update" && session) token = { ...token, ...(session as any) };
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token as any).userId,
        roles: (token as any).roles ?? [RoleEnum.USER],
      } as any;
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },

  // @ts-expect-error – authorized is a new NextAuth v5 top-level option
  authorized({ request, auth: session }) {
    const { pathname } = request.nextUrl;

    if (isPublic(pathname)) return true;
    if (!session?.user) return false;

    const roles = (session.user as any).roles as string[] | undefined;
    const rule = matchRule(pathname);

    if (!rule) return true; // no specific restriction
    return hasAtLeast(roles, rule.minRole);
  },
});
