if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}
// console.log(process.env);


const mongoose = require("mongoose");
const express = require("express");
const app = express();
const PORT = 3000;

const Plant = require("./models/plants.js");
const wrapAsync = require("./utils/wrapAsync.js");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");

const plantRouter= require("./routers/plants")
const userRouter = require("./routers/user");
const orderRouter = require("./routers/order");
const cartRouter = require("./routers/cart");
const adminRouter = require("./routers/admin");
const feedbackRouter = require('./routers/feedback');

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/Users.js");
const Admin = require("./models/Admins.js");


app.use(methodoverride('_method'));
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static('dest:/uploads'));
app.engine("ejs",ejsMate);

main().then((res)=>{
    console.log(res);
}).catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/nursery');
}

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));



// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use('user-local', new LocalStrategy(User.authenticate()));
passport.use('admin-local', new LocalStrategy(Admin.authenticate()));

// // Add after session middleware
// app.use(csrf({ cookie: true }));

passport.serializeUser((userOrAdmin, done) => {
    const type = userOrAdmin.isAdmin ? 'admin' : 'user';
    done(null, { id: userOrAdmin._id, type });
});

passport.deserializeUser(async (data, done) => {
    try {
        let result;
        if (data.type === 'admin') {
            result = await Admin.findById(data.id);
        } else {
            result = await User.findById(data.id);
        }
        done(null, result);
    } catch (err) {
        done(err, null);
    }
});

// Flash middleware
app.use(flash());

// app.use((req, res, next) => {
//     console.log('Current user:', req.user);
//     console.log('Is authenticated:', req.isAuthenticated());
//     next();
// });

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.isAdmin = req.user && req.user.isAdmin;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});



app.use("/plants", plantRouter);
app.use("/users", userRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/admin",adminRouter);
app.use('/feedback', feedbackRouter);


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!";
    res.status(status).render("error", { err });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});