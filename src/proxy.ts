import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect only.
 *
 * This checks for the presence of a session cookie so signed-out visitors get
 * sent to /login without a database round trip. It deliberately does not verify
 * the session — Next's own guidance is that proxy is not an authorization
 * layer. The real check is `requireAdmin()` in src/lib/auth/guard.ts, called by
 * every admin page and every admin server action.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSessionCookie = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
