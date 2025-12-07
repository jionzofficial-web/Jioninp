import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
    supplier_name: {
        type: String,
        trim: true,
        default: 'General Supplier'
    },
    purchase_date: {
        type: Date,
        default: Date.now,
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        product_name: String,
        variant_id: String, // ID of the variant subdocument
        variant_name: String, // e.g., "Red - 128GB"
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        buy_price: {
            type: Number,
            required: true,
            min: 0,
        },
        total_cost: {
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
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
