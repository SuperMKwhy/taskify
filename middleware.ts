import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "taskify_session";
const PUBLIC_PAGES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const isApi = pathname.startsWith("/api/");

  if (!hasSession && !isPublicPage) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/api/tasks/:path*", "/api/projects/:path*"],
};
