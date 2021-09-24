const express = require("express");
const app = express();
// for body parsing from the POST request
app.use(express.urlencoded({ extended: false }));


const hb = require("express-handlebars")
app.engine("handlebars", hb())
app.set("view engine", "handlebars")

// for serving files inside public
app.use(express.static("public"))

const cookieSession = require('cookie-session');
app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

const db = require("./db.js");
const bc = require("./bc");
// let tempCookie;
let sigValue;

// 0 route
app.get("/", (req,res) => {
    res.redirect("/login");
});

// 1st route to show the sign page
app.get("/petition", (req, res) => {
    // the user must first register/login >>>> to be able to sign the petition
    if(req.session.userId === undefined) {
        res.redirect("/login");
    } else {
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
    }
})

// 2nd route to save signer data in our database & redirect to thank you page
app.post("/petition", (req, res) => {
    
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
});

// 3rd route to show list of all signers
app.get("/thanks", (req, res) => {
     // the user must first register/login 
     if(req.session.userId === undefined) {
        res.redirect("/login");
    } else {
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
});

// 4th route to show list of all signers
app.get("/signers", (req, res) => {
    console.log("req.session.signed", req.session.signed);
    console.log("req.session.userId", req.session.userId);

    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.signed === undefined) {
        res.redirect("/petition");
    } else {
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


});

// 5th route to show the register page
app.get("/register", (req, res) => {
    // check IF the user has already registered or logged in >> redirect to /petition
    if(req.session.userId === undefined) {
        res.render("register", {
            layout: "main",
            headerMessage: "Welcome to My Petition Page",
            title: "Petition"
        })
    } else {
        res.redirect("/petition");
    }
    
})

// 6th route to save registeration data in our DB 
app.post("/register", (req, res) => {
    
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
    
})


// 7th route to show the login page
app.get("/login", (req, res) => {
    // check IF the user has already registered or logged in >> redirect to /petition
    if(req.session.userId === undefined) {
        res.render("login", {
        layout: "main",
        headerMessage: "Welcome to My Petition Page",
        title: "Petition"
        })
    } else {
        res.redirect("/petition");
    }
})

// 8th route to compare the login data with our DB 
app.post("/login", (req, res) => {
    // ** check IF the user has already signed the petition >> redirect to /thanks

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

})

// 9th logout : clear cookies & redirect to /login page 
app.get("/logout", (req, res) => {
    req.session = null;
    // delete req.session.userId;
    res.redirect("/login");
})

// 10th route to show the profile page
app.get("/profile", (req, res) => {
    // check IF the user has already registered or logged in 
    if(req.session.userId !== undefined) {
        res.render("profile", {
            layout: "main",
            headerMessage: "Welcome to My Petition Page",
            title: "Petition"
        })
    } else {
        res.redirect("/login");
    }
    
})

// 11th route to save profile data in my DB
app.post("/profile", (req,res) => {
    const age = req.body.age? req.body.age : null;
    const city = req.body.city? req.body.city : null;
    let homepage = (req.body.homepage && req.body.homepage.startsWith('http' || 'https'))? req.body.homepage : null;
    console.log("age,city,homepage:",age,city,homepage);
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
                    headerMessage: "Error occured in DB: We already saved your data!",
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
})

// 12th route to show list of all signers from 1 city
app.get("/signers/:city", (req, res) => {
    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.signed === undefined) {
        res.redirect("/petition");
    } else {

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
});

// 13th route to edit profile
app.get("/profile/edit", (req, res) => {
    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.userId === undefined) {
        res.redirect("/login");
    } else {
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


});

// 14th route to save new profile data in DB
app.post("/profile/edit", (req, res) => {
    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.userId === undefined) {
        res.redirect("/login");
    } else {
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


});

// 15th route to delete signature
app.post("/thanks", (req, res) => {
    
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
});
    
// 16th route to delete the whole profile
app.get("/profile/delete", (req, res) => {
    res.send(`<h1>Please confirm deleting your profile</h1>
            <form method="post">
                <div class="nextBtn">
                    <input type="submit" value="Delete">
                </div>
            </form>
            `);
});

// 17th route to delete the whole profile
app.post("/profile/delete", (req, res) => {
    
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
});
    
app.listen(process.env.PORT || 8080, () => console.log("petition server is listening..."));