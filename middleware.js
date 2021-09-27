const db = require("./db.js");
const bc = require("./bc");



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

module.exports.getPetition = function (req, res, next) {
    // Here means the user is logged in 
    db.getSignature(req.session.userId)
    .then((dbResults) => {

        if(dbResults.rows.length === 0) {
            console.log("empty rows");
            // if no signature found in DB >>>> direct the user to sign 
            res.render("home", {
                layout: "main",
                headerMessage: "Welcome to My Petition Page",
                title: "Petition"
            })
        } else {
            console.log("signature exists");
            console.log("Here means the user has signed already");
            res.redirect("/thanks");  
        }
        
    })
    .catch((err) => {
        console.log("No Signature found: ", err);
    }); 
};

module.exports.postPetition = function (req, res, next) {
const signature = req.body.signature;
    
if(signature.length === 0) {
    console.log("Error: Missing signature");
    res.render("home", {
        layout: "main",
        headerMessage: "Error: Missing signature!",
        title: "Petition"
    })
} else {
    db.addSigner(signature, req.session.userId)
        .then(() => {
            req.session.signed = "true";
            res.redirect("/thanks");
        })
        // in case problem occured while writing to db >>>> show again the petition page
        .catch((err) => {
            console.log("err in db.addSigner: ", err);
            res.render("home", {
                layout: "main",
                headerMessage: "Error occured in DB: please sign again!",
                title: "Petition"
            })
        });
}
}

module.exports.getThanks = function (req, res, next) {
     // the user must first register/login 

    // Here means the user is logged in 
    db.getSignature(req.session.userId)
    .then((dbResults) => {
        // Here means the user has signed already
        req.session.signed = "true";
        sigValue = dbResults.rows[0].signature;
        res.render("thanks", {
            sigValue,
            layout: "main",
            headerMessage: "Thank you!",
            title: "Petition"
        });
    })
    .catch((err) => {
        console.log("err in db.getSignature: ", err);
        // if no signature found in DB >>>> direct the user to sign 
        res.redirect("/petition");
    });
}

module.exports.getSigners = function (req, res, next) {
    db.getSigners()
    .then((dbResults) => {
        const allSigners = dbResults.rows;
        const totalNum = allSigners.length;
        // console.log("dbResults: ", allSigners);
        // console.log("all signers in db: ", allSigners[2].row[2]);
        res.render("signers", {
            allSigners,
            totalNum,
            layout: "main",
            headerMessage: "Here is the full list of our signers:",
            title: "Petition"
        })
    })
    .catch((err) => {
        console.log("err in db.getSigners: ", err);
        // in case problem happened >>>> try again to load signers list
        res.redirect("/signers");
    });
}

module.exports.getRegister = function (req, res, next) {
    // check IF the user has already registered or logged in >> redirect to /petition
    res.render("register", {
        layout: "main",
        headerMessage: "Welcome to My Petition Page",
        title: "Petition"
    })
}

module.exports.postRegister = function (req, res, next) {

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email
    const password = req.body.password;;

    bc.hash(password)
    .then((hashedPw) => {
        db.register(firstName, lastName, email, hashedPw)
        .then((userId) => {
            //get the user id given to this last added row >>>> save it inside cookie
            req.session.userId = userId.rows[0].id;
            console.log("one more user was added to users table in petition db");
            // a new user who has just registered will be directed to sign the petition
            res.redirect("/profile");
        })
        // in case problem occured while writing to db >>>> show again the register page
        .catch((err) => {
            console.log("err in db.register: ", err);
            res.render("register", {
                layout: "main",
                headerMessage: "Error occured in DB: please register again!",
                title: "Petition"
            })
        });

    })
    .catch((err) => {
        console.log("err in bc.hash: ", err);
        res.render("register", {
            layout: "main",
            headerMessage: "Error occured in bc.hash: please register again!",
            title: "Petition"
        })
    });
}

module.exports.getLogin = function (req, res, next) {
    // check IF the user has already registered or logged in >> redirect to /petition
    res.render("login", {
        layout: "main",
        headerMessage: "Welcome to My Petition Page",
        title: "Petition"
        })
}

module.exports.postLogin = function (req, res, next) {
    const email = req.body.email;
    const password = req.body.password;

    db.getHashedPw(email)
    .then((hashedPw) => {
        bc.compare(password, hashedPw.rows[0].password)
        .then((match) => {
            if(match) {
                console.log("correct password");
                db.getRegisterId(email)
                .then((userId) => {
                    // set a cookie to remember the logged in user
                    req.session.userId = userId.rows[0].id;
                    // redirect the user to sign the petition
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("db.getRegisterId: ", err);
                    res.render("register", {
                        layout: "main",
                        headerMessage: "Error occured in db.getRegisterId: please register again!",
                        title: "Petition"
                    })
                });

            } else {
                console.log("wrong password");
                res.render("login", {
                    layout: "main",
                    headerMessage: "Error: Wrong Password, Please Login again!",
                    title: "Petition"
                })
            }
            
        })
        .catch((err) => {
            console.log("err in bc.compare: ", err);
            res.render("login", {
                layout: "main",
                headerMessage: "Errorin bc.compare, Please Login again!",
                title: "Petition"
            })
        })
    })
    .catch((err) => {
        console.log("err in db.getHashedPw: ", err);
        res.render("login", {
            layout: "main",
            headerMessage: "Error: Wrong Email, Please Login again!",
            title: "Petition"
        })
    })
}

module.exports.getLogout = function (req, res, next) {
    req.session = null;
    res.redirect("/login");
}

module.exports.getProfile = function (req, res, next) {
    // check IF the user has already registered or logged in 
    res.render("profile", {
        layout: "main",
        headerMessage: "Welcome to My Petition Page",
        title: "Petition"
    })
}

module.exports.postProfile = function (req, res, next) {
    const age = req.body.age? req.body.age : null;
    const city = req.body.city? req.body.city : null;
    let homepage = (req.body.homepage && req.body.homepage.startsWith('http' || 'https'))? req.body.homepage : null;
    // console.log("age,city,homepage:",age,city,homepage);
    // // homepage url validation
    // if(!homepage.startsWith('http' || 'https')) {
    //     homepage = null;
    // }

    db.profile(age, city, homepage, req.session.userId)
        .then(() => {
            res.redirect("/petition");
        })
        // in case problem occured while writing to db >>>> show again the profile page
        .catch((err) => {
            console.log("err in db.profile: ", err);
            if(err.detail && err.detail.includes("already exists")) {
                res.render("profile", {
                    layout: "main",
                    headerMessage: "Error occured in DB: You may do only profile update!",
                    title: "Petition"
                })
            } else {
                res.render("profile", {
                    layout: "main",
                    headerMessage: "Error occured in DB.",
                    title: "Petition"
                })
            }
            
        });
}

module.exports.getCity = function (req, res, next) {

    db.getCity(req.params.city)
    .then((dbResults) => {
        const allSigners = dbResults.rows;
        const totalNum = allSigners.length;
        // console.log("dbResults: ", allSigners);
        // console.log("all signers in db: ", allSigners[2].row[2]);
        res.render("signers", {
            allSigners,
            totalNum,
            layout: "main",
            headerMessage: "Here is the full list of our signers:",
            title: "Petition"
        })
    })
    .catch((err) => {
        console.log("err in db.getSigners: ", err);
        // in case problem happened >>>> try again to load signers list
        res.redirect("/signers");
    }); 
}

module.exports.getEditProfile = function (req, res, next) {
    db.getUser(req.session.userId)
    .then((dbResults) => {
        const user_data = dbResults.rows[0];
        // console.log("user_data", user_data);
        res.render("profile_edit", {
            user_data,
            layout: "main",
            headerMessage: "your data",
            title: "Petition"
        })
    })
    .catch((err) => {
        console.log("err in db.getUser: ", err);
        // in case problem happened >>>> try again to load signers list
        res.redirect("/profile/edit");
    });
}

module.exports.postEditProfile = function (req, res, next) {

    const {firstName, lastName, email, password, age, city, homepage} = req.body;
    let homepageSafe = (homepage && homepage.startsWith('http' || 'https'))? homepage : null;

    bc.hash(password)
    .then((hashedPw) => {
        db.editUser(req.session.userId,firstName, lastName, email, hashedPw)
        .then((dbResults) => {
            console.log("user data updated", req.session.userId);
            db.editProfile(req.session.userId,age, city, homepageSafe)
            .then((dbResults) => {
                console.log("profile data updated", req.session.userId);
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("err in db.editProfile: ", err);
                // in case problem happened >>>> try again to load signers list
                res.redirect("/profile/edit");
            });
        })
        .catch((err) => {
            console.log("err in db.editUser: ", err);
            // in case problem happened >>>> try again to load signers list
            res.redirect("/profile/edit");
        });
        })  
}

module.exports.postThanks = function (req, res, next) {

    db.deleteSignature(req.session.userId)
    .then((dbResults) => {
        console.log("signature deleted fir user id:", req.session.userId);
        res.redirect("/petition");
    })
    .catch((err) => {
        console.log("err in db.deleteSignature: ", err);
        // in case problem happened >>>> try again to load signers list
        res.redirect("/petition");
    });
}

module.exports.getDeleteProfile = function (req, res, next) {

    res.send(`<h1>Please confirm deleting your profile</h1>
    <form method="post">
        <div class="nextBtn">
            <input type="submit" value="Delete">
        </div>
    </form>
    `);
}


module.exports.postDeleteProfile = function (req, res, next) {
    
    db.deleteProfile(req.session.userId)
    .then((dbResults) => {
        console.log("profile deleted for user id:", req.session.userId);
        db.deleteSignature(req.session.userId)
        .then((dbResults) => {
            console.log("signature deleted for user id:", req.session.userId);
            db.deleteUser(req.session.userId)
            .then((dbResults) => {
                console.log("user deleted for user id:", req.session.userId);
                // clear all cookies
                req.session = null;
                res.redirect("/login");
            })
            .catch((err) => {
                console.log("err in db.deleteSignature: ", err);
                // in case problem happened >>>> try again to load signers list
                res.redirect("/login");
            })
        })
        .catch((err) => {
            console.log("err in db.deleteSignature: ", err);
            // in case problem happened >>>> try again to load signers list
            res.redirect("/login");
        });
    })
    .catch((err) => {
        console.log("err in db.deleteProfile: ", err);
        // in case problem happened >>>> try again to load signers list
        res.redirect("/login");
    });
}