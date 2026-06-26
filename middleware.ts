import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Management portal
  if (pathname.startsWith('/markaz')) {
    const session = req.cookies.get('admin_session');
    if (session?.value !== process.env.AUTH_COOKIE_SECRET) {
      return NextResponse.redirect(new URL('/kirish?role=admin', req.url));
    }
  }

  // Parent portal
  if (pathname.startsWith('/ota-ona')) {
    const session = req.cookies.get('parent_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/kirish?role=parent', req.url));
    }
  }

  // Student portal
  if (pathname.startsWith('/talaba')) {
    const session = req.cookies.get('student_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/kirish?role=student', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/markaz/:path*', '/ota-ona/:path*', '/talaba/:path*'],
};
