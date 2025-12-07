import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product'; // Ensure models are loaded
import { verifyJwtToken } from '@/lib/auth';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await dbConnect();

        const order = await Order.findById(id).populate('items.product');

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
