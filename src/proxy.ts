import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const validateCommentPath = (pathname: string): boolean => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 1) return false;
  const lastSegment = segments[segments.length - 1];
  const secondLastSegment = segments[segments.length - 2] ?? "";
  const cuidSchema = z.string().cuid();

  if (lastSegment === "comments") return true;
  if (
    secondLastSegment === "comments" &&
    cuidSchema.safeParse(lastSegment).success
  ) {
    return true;
  }
  return false;
};

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const pathname = new URL(request.url).pathname;
  if (
    token &&
    (pathname === "/api/auth/signin" || pathname === "/api/auth/signup")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && pathname === "") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token === null && pathname === "/api/auth/signout") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    token === null &&
    (pathname === "/community/create" || pathname === "/post/create")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.includes("/comments")) {
    if (!validateCommentPath(pathname)) {
      // If the path doesn't match our expected format, redirect or block the request.
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  // const protectedRoutes = [];
  // if (!token && protectedRoutes.includes(pathname)) {
  //     return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/signup",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/session",
    "/community/create",
    "/post/create",
    "/community/:path*",
    "/post/:path*",
  ], // Apply middleware to these routes
};
