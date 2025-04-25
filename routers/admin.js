const express = require('express');
const router = express.Router();
const passport = require('passport');
const Admin = require('../models/Admins');
const { isAdmin } = require('../middleware');
const Plant = require('../models/plants');
const Order = require('../models/order');
const User = require('../models/Users');
const Bill = require('../models/Bills');

router.get('/orders', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate({
                path: 'user',
                model: 'User',
                select: 'username email'
            })
            .populate({
                path: 'items.plant',
                model: 'Plant',
                select: 'name price'
            })
            .sort({ createdAt: -1 });

        // Debug log to verify data
        // console.log('Orders with populated data:', orders);

        res.render('admin/orders', { orders });
    } catch (err) {
        console.error('Orders Error:', err);
        req.flash('error', 'Error loading orders');
        res.redirect('/admin/dashboard');
    }
});

router.patch('/orders/:orderId/status', isAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        let { status } = req.body;
        
        // Convert status to lowercase for consistency
        status = status.toLowerCase();

        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { status: status },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        // Handle inventory for cancelled orders
        if (status === 'cancelled') {
            for (const item of order.items) {
                await Plant.findByIdAndUpdate(item.plant, {
                    $inc: { quantity: item.quantity }
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error updating order status'
        });
    }
});

router.get('/profile', isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/plants');
        }
        res.render('admin/profile', { admin });
    } catch (err) {
        console.error('Profile Error:', err);
        req.flash('error', 'Error loading profile');
        res.redirect('/plants');
    }
});

router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        // Get counts for plants and total orders
        const plantsCount = await Plant.countDocuments();
        const ordersCount = await Order.countDocuments();

        // Get users count (excluding admins)
        const usersCount = await User.countDocuments({ isAdmin: { $ne: true } });
        
        // Get order status counts
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(5);

        res.render('admin/dashboard', {
            plantsCount,
            usersCount,
            ordersCount,
            completedOrders,
            cancelledOrders,
            recentOrders
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/admin');
    }
});

router.get('/login', (req, res) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return res.redirect('/plants');
    }
    res.render('admin/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('admin-local', (err, admin, info) => {
        if (err) {
            console.error('Admin Login Error:', err);
            req.flash('error', 'An error occurred during login');
            return res.redirect('/admin/login');
        }

        if (!admin) {
            req.flash('error', info.message || 'Invalid username or password');
            return res.redirect('/admin/login');
        }

        req.logIn(admin, (err) => {
            if (err) {
                req.flash('error', 'Login error');
                return res.redirect('/admin/login');
            }

            req.flash('success', 'Welcome Admin!');
            res.redirect('/plants');
        });
    })(req, res, next);
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye Admin!');
        res.redirect('/plants');
    });
});

router.get('/inventory', isAdmin, async (req, res) => {
    try {
        const plants = await Plant.find({}).sort('name');
        res.render('admin/inventory', { plants });
    } catch (err) {
        req.flash('error', 'Error loading inventory');
        res.redirect('/admin');
    }
});

router.patch('/inventory/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { operation, amount } = req.body;
        
        const plant = await Plant.findById(id);
        if (!plant) {
            return res.status(404).json({ success: false, error: 'Plant not found' });
        }

        // Calculate new quantity
        const change = operation === 1 ? amount : -amount;
        const newQuantity = plant.quantity + change;

        // Validate new quantity
        if (newQuantity < 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot reduce quantity below 0' 
            });
        }

        // Update plant quantity
        plant.quantity = newQuantity;
        await plant.save();

        res.json({ 
            success: true, 
            message: `Successfully ${operation === 1 ? 'added' : 'removed'} ${amount} units`,
            newQuantity: plant.quantity
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error updating quantity' });
    }
});

router.get('/sales-report', isAdmin, async (req, res) => {
    try {
        res.render('admin/sales-report');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Error loading sales report');
        res.redirect('/admin/dashboard');
    }
});

router.post('/generate-report', isAdmin, async (req, res) => {
    try {
        const { dateRange, startDate, endDate } = req.body;
        let queryStartDate, queryEndDate;

        if (dateRange === 'custom') {
            queryStartDate = new Date(startDate);
            queryEndDate = new Date(endDate);
        } else {
            queryEndDate = new Date();
            queryStartDate = new Date();
            queryStartDate.setDate(queryStartDate.getDate() - parseInt(dateRange));
        }

        const orders = await Order.find({
            createdAt: {
                $gte: queryStartDate,
                $lte: queryEndDate
            }
        }).populate('items.plant');

        // Calculate statistics
        let totalSales = 0;
        let totalUnits = 0;
        const plantSales = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                totalSales += item.price * item.quantity;
                totalUnits += item.quantity;

                if (!plantSales[item.plant._id]) {
                    plantSales[item.plant._id] = {
                        name: item.plant.name,
                        unitsSold: 0,
                        revenue: 0
                    };
                }
                plantSales[item.plant._id].unitsSold += item.quantity;
                plantSales[item.plant._id].revenue += item.price * item.quantity;
            });
        });

        const report = {
            totalSales,
            totalUnits,
            totalOrders: orders.length,
            plantsSold: Object.values(plantSales)
        };

        res.json({ success: true, report });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;