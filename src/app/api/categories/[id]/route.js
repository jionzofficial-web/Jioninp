import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

// GET single category
export async function GET(req, { params }) {
    try {
        await dbConnect();

        const category = await Category.findById(params.id).populate('parent');

        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        console.error('Get category error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PUT update category
export async function PUT(req, { params }) {
    try {
        await dbConnect();

        const body = await req.json();
        const category = await Category.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });

        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        console.error('Update category error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}

// DELETE category
export async function DELETE(req, { params }) {
    try {
        await dbConnect();

        const body = await req.json();
        if (body.password !== 'admin008') {
            return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
        }

        const category = await Category.findByIdAndDelete(params.id);

        if (!category) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error('Delete category error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
