import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        return {
          id: data.user.id ?? data.user._id ?? data.user.userId,
          name: data.user.name,
          email: data.user.phone ?? undefined,
          roles: data.user.roles ?? [data.user.role ?? "USER"],
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
        id: (token as any).userId ?? "",
        roles: ((token as any).roles as string[]) ?? ["USER"],
      } as any;
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
});
