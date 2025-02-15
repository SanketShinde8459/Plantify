const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        plant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plant',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    payType: {
        type: String,
        default: 'Cash on Delivery'
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);