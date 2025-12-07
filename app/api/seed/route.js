import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        const email = 'admin@example.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOneAndUpdate(
            { email },
            {
                username: 'admin',
                email,
                password: hashedPassword,
                full_name: 'Admin User',
                role: 'admin',
                permissions: ['all'],
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Admin user seeded successfully',
            user: { email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
