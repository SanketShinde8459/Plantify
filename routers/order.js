const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Cart = require('../models/Cart');
const Bill = require('../models/Bills');
const Plant = require('../models/plants');
const { isLoggedIn } = require('../middleware');


router.post('/checkout', isLoggedIn, async (req, res) => {
    try {
        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.plant');

        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Calculate total amount
        const total = cart.items.reduce((sum, item) => {
            return sum + (item.plant.price * item.quantity);
        }, 0);

        // Create order items with proper price
        const orderItems = cart.items.map(item => ({
            plant: item.plant._id,
            quantity: item.quantity,
            price: item.plant.price
        }));

        // Create new order
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            shippingAddress: req.body.shippingAddress,
            total: total,
            totalAmount: total,
            payType: req.body.paymentType || 'Cash on Delivery',
            status: 'placed'
        });

        await order.save();

        // Create bill
        const bill = new Bill({
            orders: [order._id],
            total: total,
            pay_type: 'Cash on Delivery', // Make sure this matches the enum
            paymentStatus: 'Pending'
        });

        await bill.save();

        // Update inventory
        for (const item of cart.items) {
            await Plant.findByIdAndUpdate(
                item.plant._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Delete cart
        await Cart.findByIdAndDelete(cart._id);

        req.flash('success', 'Order placed successfully!');
        return res.redirect(`/orders/${order._id}`);

    } catch (err) {
        console.error("Checkout Error:", err);
        req.flash('error', 'Error placing order: ' + (err.message || 'Unknown error'));
        return res.redirect('/cart');
    }
});

// View All Orders
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.plant')
            .sort({ createdAt: -1 });
        res.render('orders/index', { orders });
    } catch (err) {
        req.flash('error', 'Cannot fetch orders');
        res.redirect('/');
    }
});

// View Single Order
router.get('/:orderId', isLoggedIn, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.plant')
            .populate('user');
            
        const bill = await Bill.findOne({ orders: order._id });
        
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }
        
        return res.render('orders/show.ejs', { order, bill });
    } catch (err) {
        console.error('Order Error:', err);
        req.flash('error', 'Cannot fetch order details');
        return res.redirect('/orders');
    }
});

// View Bill
router.get('/:orderId/bill', isLoggedIn, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.plant')
            .populate('user', 'username email');
            
        const bill = await Bill.findOne({ orders: order._id });

        if (!order || !bill) {
            req.flash('error', 'Order or bill not found');
            return res.redirect('/orders');
        }

        return res.render('orders/bill', { order, bill });
    } catch (err) {
        console.error('Bill Error:', err);
        req.flash('error', 'Cannot fetch bill details');
        return res.redirect('/orders');
    }
});

// Cancel Order
router.post('/:orderId/cancel', isLoggedIn, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }

        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            req.flash('error', 'Not authorized');
            return res.redirect('/orders');
        }

        // Only allow cancellation if order is in 'placed' status
        if (order.status !== 'placed') {
            req.flash('error', 'Cannot cancel order in current status');
            return res.redirect(`/orders/${orderId}`);
        }

        order.status = 'cancelled';
        order.cancellationReason = reason;
        await order.save();

        // Return items to inventory
        for (const item of order.items) {
            await Plant.findByIdAndUpdate(item.plant, {
                $inc: { quantity: item.quantity }
            });
        }

        req.flash('success', 'Order cancelled successfully');
        return res.redirect('/orders');
    } catch (error) {
        console.error('Cancel Order Error:', error);
        req.flash('error', 'Error cancelling order');
        return res.redirect(`/orders/${req.params.orderId}`);
    }
});

module.exports = router;