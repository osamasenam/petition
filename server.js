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

// 1st route to show the sign page
app.get("/petition", (req, res) => {
    // the user must first register/login >>>> to be able to sign the petition
    if(req.session.userId === undefined) {
        res.redirect("/login");
    } else {
        // Here means the user is logged in 
        db.getSignature(req.session.userId)
        .then((dbResults) => {

            if(dbResults.rows[0].signature === undefined) {
                console.log("empty rows");
            } else {
                console.log("signature exists");
                console.log("Here means the user has signed already");
                res.redirect("/thanks");  
            }
            
        })
        .catch((err) => {
            console.log("No Signature found: ", err);
            // if no signature found in DB >>>> direct the user to sign 
            res.render("home", {
                layout: "main",
                headerMessage: "Welcome to My Petition Page",
                title: "Petition"
            })
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
    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.signatureId === undefined) {
        res.redirect("/petition");
    } else {
        db.getSigners()
        .then((dbResults) => {
            const allSigners = dbResults.rows;
            const totalNum = allSigners.length;
            // console.log("all signers in db: ", allSigners);
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
            res.redirect("/petition");
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
    delete req.session.userId;
    res.redirect("/login");
})


app.listen(8080, () => console.log("petition server is listening..."));