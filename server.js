const express = require("express");
const app = express();
// for body parsing from the POST request
app.use(express.urlencoded({ extended: false }));

// ?causes problem with jquery? security against clickjacking attacks
// const helmet = require('helmet');
// app.use(helmet());
// app.use(helmet.frameguard({ action: 'DENY' }));

// const csurf = require('csurf');
// app.use(csurf());
app.use((req, res, next) => {
    res.set('x-frame-options', 'deny');
    // res.locals.csrfToken = req.csrfToken();
    next();
});

const hb = require("express-handlebars")
app.engine("handlebars", hb())
app.set("view engine", "handlebars")

// for serving files inside public
app.use(express.static("public"))

// CSRF security
const cookieSession = require('cookie-session');
app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14,
    sameSite: true
}));




const { requireLoggedInUser, requireLoggedOutUser, requireNoSignature, requireSignature,
     getPetition, postPetition, getThanks, getSigners,
     getRegister, postRegister, getLogin, postLogin, getLogout, 
     getProfile, postProfile, getCity, getEditProfile, postEditProfile, 
     postThanks, getDeleteProfile, postDeleteProfile
     } = require('./middleware');
app.use(requireLoggedInUser);

// 0 route
app.get("/", (req,res) => {
    res.redirect("/login");
});

// 1st route to show the sign page
app.get("/petition", requireLoggedInUser, getPetition);

// 2nd route to save signer data in our database & redirect to thank you page
app.post("/petition", postPetition);

// 3rd route to show list of all signers
app.get("/thanks", requireLoggedInUser, getThanks);

// 4th route to show list of all signers
app.get("/signers", requireSignature, getSigners);

// 5th route to show the register page
app.get("/register", requireLoggedOutUser, getRegister);

// 6th route to save registeration data in our DB 
app.post("/register", postRegister);

// 7th route to show the login page
app.get("/login", requireLoggedOutUser, getLogin);

// 8th route to compare the login data with our DB 
app.post("/login", postLogin);

// 9th logout : clear cookies & redirect to /login page 
app.get("/logout", getLogout);

// 10th route to show the profile page
app.get("/profile", requireLoggedInUser, getProfile);

// 11th route to save profile data in my DB
app.post("/profile", postProfile);

// 12th route to show list of all signers from 1 city
app.get("/signers/:city", requireSignature, getCity);

// 13th route to edit profile
app.get("/profile/edit", requireLoggedInUser, getEditProfile);

// 14th route to save new profile data in DB
app.post("/profile/edit", postEditProfile);

// 15th route to delete signature
app.post("/thanks", postThanks);
    
// 16th route to delete the whole profile
app.get("/profile/delete", requireLoggedInUser, getDeleteProfile);

// 17th route to delete the whole profile
app.post("/profile/delete", postDeleteProfile);
    
app.listen(process.env.PORT || 8080, () => console.log("petition server is listening..."));