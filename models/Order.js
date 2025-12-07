import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    customer_name: {
        type: String,
        required: [true, 'Please provide a customer name'],
        trim: true,
    },
    company_name: {
        type: String,
        trim: true,
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    order_date: {
        type: Date,
        default: Date.now,
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        product_name: String, // Store name in case product is deleted
        variant_id: String,
        variant_name: String,
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unit_price: {
            type: Number,
            required: true,
            min: 0,
        },
        total_price: {
            type: Number,
            required: true,
            min: 0,
        }
    }],
    total_amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'completed',
    },
    payment_status: {
        type: String,
        enum: ['paid', 'due', 'partial'],
        default: 'paid',
        required: true
    },
    payment_method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'mobile_banking', 'other'],
        default: 'cash'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
