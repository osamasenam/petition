const bcrypt = require("bcryptjs");
const { genSalt, hash, compare } = bcrypt;

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw, salt));

// DEMO OF BCRYPT FUNCTIONALITIES
// genSalt()
//     .then((salt) => {
//         console.log("salt:", salt);
//         return hash("safePassword", salt);
//     })
//     .then((hashedPw) => {
//         console.log("hashed version of safePassword:", hashedPw);
//         // return hashedPw
//         return compare("safePassword", hashedPw);
//     })
//     .then((matchValueOfCompare) => {
//         console.log(
//             "cleartext generates passed in pw hash?",
//             matchValueOfCompare
//         );
//     });