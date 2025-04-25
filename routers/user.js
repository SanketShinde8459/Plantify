const express = require("express");
const router  = express.Router();
const User    = require("../models/Users.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const {userSchema} = require("../schema.js");
const { isLoggedIn } = require("../middleware.js");
const {saveRedirectUrl} = require("../middleware.js");

const validateUser=(req,res,next)=>{
  let {error} =userSchema.validate(req.body);
  // let {title,desc,image,} = req.body;
if(error)
{
  let errMsg = error.details.map((el)=>el.message).join(",");
throw new ExpressError(400,errMsg);
}
else{
  next();
}
}

router.get("/register",(req,res)=>{
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async (req, res) => {
    try {
        const { username, email, password, confirmPassword, mobno } = req.body;
        
        // Check if passwords match
        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect("/users/register");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            req.flash("error", "User already exists with that email or username");
            return res.redirect("/users/register");
        }

        // Create new user
        const user = new User({ email, username, mobno });
        const registeredUser = await User.register(user, password);
        
        // Login after registration
        req.login(registeredUser, err => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/users/register");
            }
            req.flash("success", "Welcome to Plantify!");
            res.redirect("/plants");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/users/register");
    }
}));

router.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/plants');
    }
    res.render("users/login"); // Make sure this view exists
});

router.post("/login", saveRedirectUrl, (req, res, next) => {
    passport.authenticate('user-local', (err, user, info) => {
        if (err) {
            console.error('Login Error:', err);
            req.flash('error', 'An error occurred during login');
            return res.redirect('/users/login');
        }

        if (!user) {
            req.flash('error', info.message || 'Invalid username or password');
            return res.redirect('/users/login');
        }

        req.logIn(user, (err) => {
            if (err) {
                req.flash('error', 'Login error');
                return res.redirect('/users/login');
            }
    
            req.flash('success', 'Welcome back!');
            const redirectUrl = res.locals.redirectUrl || '/plants';
            res.redirect(redirectUrl);
        });
    })(req, res, next);
});

router.get('/profile', isLoggedIn, async (req, res) => {
  try {
      res.render('users/profile', { user: req.user });
  } catch (err) {
      req.flash('error', 'Error loading profile');
      res.redirect('/');
  }
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/plants');
    });
});

router.get('/edit-profile', isLoggedIn, (req, res) => {
  res.render('users/edit-profile.ejs', { user: req.user });
});
router.put('/edit-profile', isLoggedIn, async (req, res) => {
  try {
    console.log("Put req to update profile hittt");
    const { username, email, mobno } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, email, mobno },
      { new: true, runValidators: true }
    );
    req.flash('success', 'Profile updated successfully');
    res.redirect('/users/profile');
  } catch (err) {
    req.flash('error', 'Error updating profile');
    res.redirect('/users/edit-profile');
  }
});



module.exports = router;