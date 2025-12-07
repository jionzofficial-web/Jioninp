import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

// GET all categories
export async function GET() {
    try {
        await dbConnect();

        const categories = await Category.find({}).populate('parent').sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create new category
export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const category = await Category.create(body);

        return NextResponse.json({ success: true, data: category }, { status: 201 });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
