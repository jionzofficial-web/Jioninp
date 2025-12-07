import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
    try {
        await dbConnect();
        return NextResponse.json({ status: 'success', message: 'Database connected successfully' });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({ status: 'error', message: 'Database connection failed', error: error.message }, { status: 500 });
    }
}
