import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Define public paths
    const publicPaths = ['/login', '/api/auth/login', '/api/auth/signup', '/api/test-db', '/api/test-imagekit', '/api/seed', '/api/products', '/api/categories'];

    // Allow root path
    if (pathname === '/') {
        return NextResponse.next();
    }

    // Check if the path is public
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check for token
    const token = request.cookies.get('token')?.value;

    const verifiedToken = token && (await verifyJwtToken(token));

    if (!verifiedToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
