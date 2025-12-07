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

        // If sell_price is being updated, also update all variants' sell_price
        if (body.sell_price !== undefined) {
            // We need to use a two-step update or a pipeline if we want to be atomic, 
            // but for simplicity with Mongoose and the current structure:
            // We'll add the variant update to the update operation.
            // However, findByIdAndUpdate with a plain object doesn't support updating array elements based on a condition easily without $set.
            // But here we want to update ALL variants.

            // A better approach for this specific requirement (syncing all variants to main price):
            // We can use a pre-hook or just do it here. 
            // Let's modify the body to include the variant update if variants aren't explicitly provided.

            if (!body.variants) {
                // If variants are not in the body, we want to update existing variants in DB.
                // We can use $set for variants.$[].sell_price
                // But findByIdAndUpdate takes 'body' which is likely a plain object replacing fields or using $set.
                // The current code passes `body` directly which implies `body` contains fields to set.
                // We should probably change this to an explicit $set to mix standard fields and operator updates.
            }
        }

        // Refined approach:
        // 1. Construct the update object.
        const updateData = { ...body };

        // 2. If sell_price is changing, ensure variants are updated too.
        // Note: This assumes we want to overwrite ALL variant prices.
        // If the user sends specific variants in the body, those will take precedence if we handle it right.
        // But the issue is the frontend sends the whole object usually.
        // Let's look at the frontend code again. It sends `productData` which includes `images` but `variants`?
        // The frontend `formData` state doesn't seem to include `variants` array explicitly in the `productData` object constructed in `handleSubmit`.
        // `const productData = { ...formData, sell_price: ..., images }`. `formData` has `sku`, `name` etc.
        // It does NOT seem to have `variants`.
        // So `body.variants` will be undefined.

        const updateOperation = { $set: updateData };

        if (body.sell_price !== undefined) {
            updateOperation.$set["variants.$[].sell_price"] = body.sell_price;
        }

        const product = await Product.findByIdAndUpdate(id, updateOperation, { new: true, runValidators: true })
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
