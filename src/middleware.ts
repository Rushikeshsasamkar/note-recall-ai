import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  publicRoutes: [
    "/",
    "/notes",
    "/api/notes",
    "/api/chat",
    "/sign-in/credentials",
    "/sign-up/credentials",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/credentials/sign-in",
    "/credentials/sign-up",
    "/api/auth/credentials/signin",
    "/api/auth/credentials/signup",
    "/api/auth/credentials/signout",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
