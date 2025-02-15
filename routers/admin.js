const express = require('express');
const router = express.Router();
const passport = require('passport');
const Admin = require('../models/Admins');
const { isAdmin } = require('../middleware');

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

module.exports = router;