import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Purchase from '@/models/Purchase';

export async function GET() {
    try {
        await dbConnect();

        // 1. Total Sales (Sum of all orders)
        const salesResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$total_amount" } } }
        ]);
        const totalSales = salesResult[0]?.total || 0;

        // 2. Active Orders (Pending)
        const activeOrders = await Order.countDocuments({ status: 'pending' });

        // 3. Total Products (Count variants if exist, else count product as 1)
        const totalProductsResult = await Product.aggregate([
            {
                $project: {
                    itemCount: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
                            then: { $size: "$variants" },
                            else: 1
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$itemCount" }
                }
            }
        ]);
        const totalProducts = totalProductsResult[0]?.total || 0;

        // 4. Total Customers (Unique names in orders)
        const customersResult = await Order.distinct('customer_name');
        const totalCustomers = customersResult.length;

        // 5. Total Purchases
        const purchasesResult = await Purchase.aggregate([
            { $group: { _id: null, total: { $sum: "$total_amount" } } }
        ]);
        const totalPurchases = purchasesResult[0]?.total || 0;

        return NextResponse.json({
            success: true,
            data: {
                totalSales,
                activeOrders,
                totalProducts,
                totalCustomers,
                totalPurchases
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
