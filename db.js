const spicedPg = require("spiced-pg");
const { dbUserName, dbPassword} = require("./secrets.json");
const database = "petition";

const db = spicedPg(
    `postgres:${dbUserName}:${dbPassword}@localhost:5432/${database}`
);

console.log(`db connecting to: ${database}`);

module.exports.getId = (idVal) => {
    const q = `SELECT signature FROM signers WHERE id=${idVal}`;
    return db.query(q);
};

module.exports.getSigners = () => {
    const q = `SELECT * FROM signers`;
    return db.query(q);
};

module.exports.addSigner = (firstName, lastName, signature) => {
    const q = `INSERT INTO signers (first_name, last_name, signature) VALUES ($1, $2, $3)`;
    const params = [firstName, lastName, signature];
    return db.query(q, params);
}