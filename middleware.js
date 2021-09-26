module.exports.requireLoggedInUser = function (req, res, next) {
    if (!req.session.userId && req.url !== '/login' && req.url !== '/register') {
        res.redirect('/login');
    } else {
        next();
    }
};

module.exports.requireLoggedOutUser = function (req, res, next) {
    if (req.session.userId) {
        res.redirect('/petition');
    } else {
        next();
    }
};

module.exports.requireNoSignature = function (req, res, next) {
    if (req.session.signed) {
        res.redirect('/thanks');
    } else {
        next();
    }
};

module.exports.requireSignature = function (req, res, next) {
    if (!req.session.signed) {
        res.redirect('/petition');
    } else {
        next();
    }
};

