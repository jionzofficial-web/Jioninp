import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Ensure model is registered
import User from '@/models/User'; // Ensure model is registered

// GET all products
export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
            ];
        }

        if (category) {
            // Check if category is an ObjectId or a name
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);

            if (isObjectId) {
                query.category = category;
            } else {
                const categoryDoc = await Category.findOne({ name: category });
                if (categoryDoc) {
                    query.category = categoryDoc._id;
                } else {
                    // If category name not found, return empty results
                    return NextResponse.json({
                        success: true,
                        data: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            pages: 0,
                        },
                    });
                }
            }
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .populate('category')
            .populate('created_by', 'full_name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create new product
export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();

        // Handle category name if provided
        if (body.category) {
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(body.category);
            if (!isObjectId) {
                const categoryDoc = await Category.findOne({ name: body.category });
                if (categoryDoc) {
                    body.category = categoryDoc._id;
                } else {
                    return NextResponse.json({
                        success: false,
                        message: `Category '${body.category}' not found`
                    }, { status: 400 });
                }
            }
        }

        // TODO: Get user ID from auth token
        // body.created_by = userId;

        const product = await Product.create(body);

        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({
            success: false,
            message: error.message,
            errors: error.errors
        }, { status: 400 });
    }
}
