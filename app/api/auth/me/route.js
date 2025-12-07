import { NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const payload = await verifyJwtToken(token);

    if (!payload) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
        authenticated: true,
        user: payload
    }, { status: 200 });
}
