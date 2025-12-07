import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Ensure model is registered
import User from '@/models/User'; // Ensure model is registered

// GET single product
export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        // Validate ID format
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ success: false, message: 'Invalid ID format' }, { status: 400 });
        }

        const product = await Product.findById(id)
            .populate('category')
            .populate('created_by', 'full_name email');

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PUT update product
export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const body = await req.json();
        const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true })
            .populate('category')
            .populate('created_by', 'full_name email');

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}

// DELETE product
export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        // Check password
        const body = await req.json();
        if (body.password !== 'admin008') {
            return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
        }

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        // Delete images from ImageKit
        const imagekit = (await import('@/lib/imagekit')).default;
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                try {
                    await new Promise((resolve, reject) => {
                        imagekit.deleteFile(image.imagekit_id, function (error, result) {
                            if (error) reject(error);
                            else resolve(result);
                        });
                    });
                } catch (error) {
                    console.error('Error deleting image from ImageKit:', error);
                }
            }
        }

        // Delete product from MongoDB
        await Product.findByIdAndDelete(id);

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
