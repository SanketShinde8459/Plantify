const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Cart = require('../models/Cart');
const Bill = require('../models/Bills');
const Plant = require('../models/plants');
const { isLoggedIn } = require('../middleware');

// Place Order
router.post('/checkout', isLoggedIn, async (req, res) => {
    const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.plant');

        if (!cart || cart.items.length === 0) {
            req.flash('error', 'Cart is empty');
            return res.redirect('/cart');
        }

        // Verify stock availability
        for (const item of cart.items) {
            console.log(item);
            if (item.quantity > item.plant.quantity) {
                throw new Error(`Insufficient stock for ${item.plant.name}`);
            }
        }

        // Update plant quantities
        for (const item of cart.items) {
            await Plant.findByIdAndUpdate(
                item.plant._id,
                { $inc: { quantity: -item.quantity } }, // Reduce quantity
                { session, new: true }
            );
        }

        // Create new order
        const order = new Order({
            user: req.user._id,
            items: cart.items.map(item => ({
                plant: item.plant._id,
                quantity: item.quantity,
                price: item.plant.price
            })),
            totalAmount: cart.items.reduce((sum, item) => sum + (item.plant.price * item.quantity), 0),
            status: 'Pending'
        });

        await order.save({ session });

        // Create bill
        const bill = new Bill({
            orders: [order._id],
            total: order.totalAmount,
            pay_type: 'Cash On Delivery',
            paymentStatus: 'Pending'
        });

        await bill.save({ session });

        // Delete cart after successful order
        await Cart.deleteOne({ user: req.user._id }, { session });


        req.flash('success', 'Order placed successfully!');
        return res.redirect(`/orders/${order._id}`);
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();

       

    } catch (err) {
        console.error("Checkout Error:", err);
        await session.abortTransaction();
        session.endSession();

        req.flash('error', err.message || 'Error placing order');
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
        
        res.render('orders/show.ejs', { order, bill });
    } catch (err) {
        req.flash('error', 'Cannot fetch order details');
        res.redirect('/orders');
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

        res.render('orders/bill', { order, bill });
    } catch (err) {
        console.error('Bill Error:', err);
        req.flash('error', 'Cannot fetch bill details');
        res.redirect('/orders');
    }
});



module.exports = router;