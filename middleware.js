module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be signed in first!");
        return res.redirect("/users/login");
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "Admin login required");
        return res.redirect("/admin/login");
    }
    if (!req.user.isAdmin) {
        req.flash("error", "Admin privileges required");
        return res.redirect("/plants");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();  
};

module.exports.setLocals = (req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.isAdmin = req.user && req.user.isAdmin;
    next();
};

