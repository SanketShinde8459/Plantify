const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    }],
    total: {
        type: Number,
        required: true
    },
    pay_type: {
        type: String,
        default: 'Cash on Delivery',
        enum: ['Cash on Delivery']
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);