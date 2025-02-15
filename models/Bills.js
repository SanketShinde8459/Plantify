const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    billDate: {
        type: Date,
        default: Date.now
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    total: {
        type: Number,
        required: true
    },
    pay_type: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Cash On Delivery'],
        default: 'Cash On Delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
});

module.exports = mongoose.model('Bill', billSchema);