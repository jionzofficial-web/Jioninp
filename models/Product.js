import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'Please provide a SKU'],
        unique: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please provide a category'],
    },
    subcategory: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    variants: [{
        name: {
            type: String,
            required: true, // e.g., "Red - 128GB"
        },
        sku: {
            type: String,
            required: true,
        },
        buy_price: {
            type: Number,
            default: 0,
            min: 0,
        },
        sell_price: {
            type: Number,
            required: true,
            min: 0,
        },
        stock_quantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        attributes: {
            type: Map,
            of: String, // e.g., { "Color": "Red", "Storage": "128GB" }
        },
        image_index: {
            type: Number, // Index of the image in the images array
            default: 0
        }
    }],
    images: [{
        imagekit_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        thumbnail_url: {
            type: String,
        },
        is_primary: {
            type: Boolean,
            default: false,
        },
    }],
    buy_price: {
        type: Number,
        default: 0,
        min: 0,
    },
    sell_price: {
        type: Number,
        default: 0,
        min: 0,
    },
    manufacturer: {
        type: String,
        trim: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    unit: {
        type: String,
        default: 'piece',
    },
    stock_quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    reorder_point: {
        type: Number,
        default: 10,
        min: 0,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Force model recompilation in development to ensure schema changes are picked up
if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Product;
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
