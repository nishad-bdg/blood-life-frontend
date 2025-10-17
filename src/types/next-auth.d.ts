import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; roles: string[] } & DefaultSession["user"];
    accessToken?: string;
  }
  interface JWT extends DefaultJWT {
    userId?: string;
    roles?: string[];
    accessToken?: string;
    refreshToken?: string;
  }
}
