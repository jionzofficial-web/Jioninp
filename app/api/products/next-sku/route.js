import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Find the product with the highest SKU that looks like a number
        // We can't easily do regex sort in Mongo, so we'll fetch the one with highest string value
        // assuming they are padded numbers like "0000001"
        const lastProduct = await Product.findOne({
            sku: { $regex: /^\d+$/ } // Only consider purely numeric SKUs
        }).sort({ sku: -1 });

        let nextSku = '0000001';

        if (lastProduct && lastProduct.sku) {
            const lastSkuNum = parseInt(lastProduct.sku, 10);
            if (!isNaN(lastSkuNum)) {
                nextSku = (lastSkuNum + 1).toString().padStart(7, '0');
            }
        }

        return NextResponse.json({ success: true, sku: nextSku });
    } catch (error) {
        console.error('Error generating next SKU:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
