import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes
  if (pathname.startsWith('/admin')) {
    const session = req.cookies.get('admin_session');
    if (session?.value !== process.env.AUTH_COOKIE_SECRET) {
      return NextResponse.redirect(new URL('/login?role=admin', req.url));
    }
  }

  // Parent routes
  if (pathname.startsWith('/parent')) {
    const session = req.cookies.get('parent_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/login?role=parent', req.url));
    }
  }

  // Student routes
  if (pathname.startsWith('/student')) {
    const session = req.cookies.get('student_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/login?role=student', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/parent/:path*', '/student/:path*'],
};
