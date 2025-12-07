import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false, // Do not return password by default
    },
    full_name: {
        type: String,
        required: [true, 'Please provide a full name'],
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'sales', 'warehouse'],
        default: 'sales',
    },
    permissions: {
        type: [String],
        default: [],
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    last_login: {
        type: Date,
    },
}, {
    timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
