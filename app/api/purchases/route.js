import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import { verifyJwtToken } from '@/lib/auth';

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
        const purchases = await Purchase.find({}).sort({ purchase_date: -1 }).populate('items.product');
        return NextResponse.json({ success: true, data: purchases });
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

        if (!body.items || body.items.length === 0) {
            return NextResponse.json({ success: false, message: 'No items in purchase' }, { status: 400 });
        }

        // 1. Create Purchase
        const purchase = await Purchase.create(body);

        // 2. Update Stock (Increment) and Buy Price
        // 2. Update Stock (Increment) and Buy Price
        for (const item of body.items) {
            if (item.variant_id) {
                // Update specific variant AND total stock
                await Product.updateOne(
                    { _id: item.product, "variants._id": item.variant_id },
                    {
                        $inc: {
                            "variants.$.stock_quantity": item.quantity,
                            stock_quantity: item.quantity
                        },
                        $set: { "variants.$.buy_price": item.buy_price }
                    }
                );
            } else {
                // Update main product (no variant)
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock_quantity: item.quantity },
                    $set: { buy_price: item.buy_price }
                });
            }
        }

        return NextResponse.json({ success: true, data: purchase }, { status: 201 });

    } catch (error) {
        console.error('Purchase creation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
