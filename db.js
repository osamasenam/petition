const spicedPg = require("spiced-pg");
const { dbUserName, dbPassword} = require("./secrets.json");
const database = "petition";

const db = spicedPg(
    `postgres:${dbUserName}:${dbPassword}@localhost:5432/${database}`
);

console.log(`db connecting to: ${database}`);

module.exports.addSigner = (signature, userId) => {
    const q = `INSERT INTO signatures (signature, user_id) VALUES ($1 ,$2)`;
    const params = [signature, userId];
    return db.query(q, params);
}

module.exports.register = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [firstName, lastName,  email, password];
    return db.query(q, params)  
}

module.exports.getUsers = () => {
    const q = `SELECT * FROM users`;
    return db.query(q);
};

module.exports.getRegisterId = (email) => {
    const q = `SELECT id FROM users WHERE email='${email}'`;
    return db.query(q);
};

module.exports.getHashedPw = (email) => {
    const q = `SELECT password FROM users WHERE email='${email}'`;
    return db.query(q);
};

module.exports.getSignature = (userId) => {
    const q = `SELECT signature FROM signatures WHERE user_id = ${userId}`;
    return db.query(q);
};
