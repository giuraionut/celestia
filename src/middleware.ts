import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = new URL(request.url).pathname;
  if (token && (pathname === '/api/auth/signin' || pathname === '/api/auth/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && pathname === '') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token === null && pathname === '/api/auth/signout') {
    return NextResponse.redirect(new URL('/', request.url));
  }


  if (token === null && (pathname === '/community/create' || pathname === '/post/create')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // const protectedRoutes = [];
  // if (!token && protectedRoutes.includes(pathname)) {
  //     return NextResponse.redirect(new URL('/', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/signup', '/api/auth/signin', '/api/auth/signout', '/api/auth/session', '/community/create', '/post/create'], // Apply middleware to these routes
};
