import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { verifyJwtToken } from '@/lib/auth';

// Helper to check auth
async function checkAuth(request) {
    const token = request.cookies.get('token')?.value;
    const verifiedToken = token && (await verifyJwtToken(token));
    return verifiedToken;
}

export async function GET(request) {
    try {
        const isAuthenticated = await checkAuth(request);
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Sort by date descending (newest first)
        const orders = await Order.find({}).sort({ order_date: -1 }).populate('items.product');

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const isAuthenticated = await checkAuth(request);
        if (!isAuthenticated) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        console.log('Received Sales Payload:', JSON.stringify(body, null, 2));

        // Validate request body
        if (!body.items || body.items.length === 0) {
            return NextResponse.json({ success: false, message: 'No items in order' }, { status: 400 });
        }

        // 1. Check Stock Availability for ALL items first
        for (const item of body.items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return NextResponse.json({
                    success: false,
                    message: `Product not found: ${item.product_name}`
                }, { status: 404 });
            }

            if (item.variant_id) {
                const variant = product.variants.id(item.variant_id);
                if (!variant) {
                    return NextResponse.json({
                        success: false,
                        message: `Variant not found for product: ${product.name}`
                    }, { status: 404 });
                }
                if (variant.stock_quantity < item.quantity) {
                    return NextResponse.json({
                        success: false,
                        message: `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stock_quantity}, Requested: ${item.quantity}`
                    }, { status: 400 });
                }
            } else {
                if (product.stock_quantity < item.quantity) {
                    return NextResponse.json({
                        success: false,
                        message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
                    }, { status: 400 });
                }
            }
        }

        // 2. Create Order
        // Generate Order Number
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await Order.countDocuments({
            createdAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        });
        const orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

        body.orderNumber = orderNumber;

        const order = await Order.create(body);

        // 3. Update Stock (Decrement)
        for (const item of body.items) {
            if (item.variant_id) {
                await Product.updateOne(
                    { _id: item.product, "variants._id": item.variant_id },
                    {
                        $inc: {
                            "variants.$.stock_quantity": -item.quantity,
                            stock_quantity: -item.quantity
                        }
                    }
                );
            } else {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock_quantity: -item.quantity }
                });
            }
        }

        return NextResponse.json({ success: true, data: order }, { status: 201 });

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
