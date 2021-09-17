const express = require("express");
const app = express();
// for body parsing from the POST request
app.use(express.urlencoded({ extended: false }));


const hb = require("express-handlebars")
app.engine("handlebars", hb())
app.set("view engine", "handlebars")

// for serving files inside public
app.use(express.static("public"))

const db = require("./db.js");

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
    
    console.log("req: ", req.body);

    db.addSigner(firstName, lastName, signature)
        .then(() => {
            // ** set cookie to remember that the user has signed
            

            console.log("one more signer added to signers table in petition db");
            res.redirect("/thanks");
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
});

// third route to show list of all signers
app.get("/thanks", (req, res) => {
    // ** check IF the user has not signed the petition >> redirect to /petition

    res.render("thanks", {
        layout: "main",
        headerMessage: "Thank you!",
        title: "Petition"
    })
});

// fourth route to show list of all signers
app.get("/signers", (req, res) => {
    // ** check IF the user has not signed the petition >> redirect to /petition

    db.getSigners()
        .then((dbResults) => {
            const allSigners = dbResults.rows;
            const totalNum = allSigners.length;
            console.log("all signers in db: ", allSigners);
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
});


app.listen(8080, () => console.log("petition server is listening..."));