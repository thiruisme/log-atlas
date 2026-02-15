import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
 
export default NextAuth(authConfig).auth
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, apple-icon.png, etc. (static files in public directory)
     */
    '/((?!api/auth|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|webmanifest|xml|txt)$).*)',
  ],
}