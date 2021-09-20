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
// let tempCookie;
let sigValue;

// first route to show the homepage
app.get("/petition", (req, res) => {
    // ** check IF the user has already signed the petition >> redirect to /thanks

    res.render("home", {
        layout: "main",
        headerMessage: "Welcome to My Petition Page",
        title: "Petition"
    })
})

// second route to save signer data in our database & redirect to thank you page
app.post("/petition", (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const signature = req.body.signature;
    
    // console.log("signature", typeof signature, signature.length);
    if(signature.length === 0) {
        console.log("Error: Missing signature");
        res.render("home", {
            layout: "main",
            headerMessage: "Error: Missing signature!",
            title: "Petition"
        })
    } else {

        db.addSigner(firstName, lastName, signature)
            .then(() => {
                // get now the id given to this last added row
                db.getSigners()
                    .then((dbResults) => {
                        const allSigners = dbResults.rows;
                        const lastId = allSigners[allSigners.length-1].id;
                        // console.log("lastId: ", lastId);
                        // ** set cookie to remember that the user has signed
                        // tempCookie = lastId;

                        req.session.signatureId = lastId;
                        console.log("req.session.signatureId",req.session.signatureId);
                    
                        console.log("one more signer added to signers table in petition db");
                        res.redirect("/thanks");
                    })
                    .catch((err) => {
                        console.log("err in db.getSigners: ", err);
                        // in case problem happened >>>> try again to load signers list
                        // res.redirect("/signers");
                    });

                
            })
            // in case problem occured while writing to db >>>> show again the petition page
            .catch((err) => {
                console.log("err in db.addSigner: ", err);
                res.render("home", {
                    layout: "main",
                    headerMessage: "Error occured in DB: please submit again!",
                    title: "Petition"
                })
            });
    }
});

// third route to show list of all signers
app.get("/thanks", (req, res) => {
    console.log("/thanks: req.session.signatureId",req.session.signatureId);
    // console.log("tempCookie",tempCookie);
    // ** check IF the user has not signed the petition >> redirect to /petition
    if(req.session.signatureId === undefined) {
        res.redirect("/petition");
    } else {

        db.getId(req.session.signatureId)
        .then((dbResults) => {
            sigValue = dbResults.rows[0].signature;
            // console.log("dbResults",dbResults.rows);
            // console.log("sigValue",sigValue);
            res.render("thanks", {
                sigValue,
                layout: "main",
                headerMessage: "Thank you!",
                title: "Petition"
            });
        })
        .catch((err) => {
            console.log("err in db.getId: ", err);
        });
        
    }
});

// fourth route to show list of all signers
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


app.listen(8080, () => console.log("petition server is listening..."));