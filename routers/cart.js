const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Plant = require('../models/plants');
const { isLoggedIn } = require('../middleware');

// View Cart
router.get('/', isLoggedIn, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.plant',
                select: 'name price imageUrl'
            });
        
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
            await cart.save();
        }

        return res.render('cart/show', { cart });
    } catch (err) {
        console.error('Cart Error:', err);
        req.flash('error', 'Unable to view cart');
        return res.redirect('/');
    }
});

// Add to Cart
router.post('/:plantId', isLoggedIn, async (req, res) => {
    try {

        const { plantId } = req.params;
        const plant = await Plant.findById(plantId);
        if(plant.quantity<= 0){
            req.flash('error', 'Product out of stock');
            return res.redirect(`/plants`);
        }
        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [{ plant: plantId, quantity: 1 }] });
        } else {
            const existingItem = cart.items.find(item => 
                item.plant && item.plant.toString() === plantId
            );
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.items.push({ plant: plantId, quantity: 1 });
            }
        }
        
        await cart.save();
        req.flash('success', 'Added to cart!');
        return res.redirect('/cart');
    } catch (err) {
        req.flash('error', 'Error adding to cart');
        return res.redirect('/plants');
    }
});

// Update quantity
router.post('/:plantId/quantity', isLoggedIn, async (req, res) => {
    try {
        const { plantId } = req.params;
        const { action } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            const cartItem = cart.items.find(item => 
                item.plant.toString() === plantId
            );

            if (cartItem) {
                if (action === 'increase') {
                    cartItem.quantity += 1;
                } else if (action === 'decrease' && cartItem.quantity > 1) {
                    cartItem.quantity -= 1;
                }
                await cart.save();
            }
        }
        res.redirect('/cart');
    } catch (err) {
        console.error('Quantity Update Error:', err);
        req.flash('error', 'Error updating quantity');
        res.redirect('/cart');
    }
});

// Remove item from cart
router.post('/:plantId/remove', isLoggedIn, async (req, res) => {
    try {
        const { plantId } = req.params;
        const cart = await Cart.findOne({ user: req.user._id });
        
        if (cart) {
            cart.items = cart.items.filter(item => 
                item.plant.toString() !== plantId
            );
            await cart.save();
            req.flash('success', 'Item removed from cart');
        }
        res.redirect('/cart');
    } catch (err) {
        console.error('Remove Error:', err);
        req.flash('error', 'Error removing item');
        res.redirect('/cart');
    }
});

module.exports = router;