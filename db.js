const spicedPg = require("spiced-pg");
// const { dbUserName, dbPassword} = require("./secrets.json");
const database = "petition";

// const db = spicedPg(
//     process.env.DATABASE_URL ||
//     `postgres:${dbUserName}:${dbPassword}@localhost:5432/${database}`
// );

let db;
if(process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    // we are running our app locally
    const { dbUserName, dbPassword} = require("./secrets.json");
    db = spicedPg(
        `postgres:${dbUserName}:${dbPassword}@localhost:5432/${database}`
    );
}

console.log(`db connecting to: ${database}`);

module.exports.addSigner = (signature, userId) => {
    const q = `INSERT INTO signatures (signature, user_id) VALUES ($1 ,$2)`;
    const params = [signature, userId];
    return db.query(q, params);
}

module.exports.register = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [firstName, lastName,  email, password];
    return db.query(q, params);  
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

module.exports.profile = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)`;
    const params = [age, city, url, user_id];
    return db.query(q, params);  
}

module.exports.getSigners = () => {
    const q = `SELECT first,last,email,age,city,url
                FROM signatures 
                LEFT OUTER JOIN users 
                ON signatures.user_id = users.id 
                LEFT OUTER JOIN user_profiles 
                ON signatures.user_id = user_profiles.user_id ;`;
    return db.query(q);
};

module.exports.getCity = (city) => {
    const q = `SELECT first,last,age,city,url
                FROM signatures 
                LEFT OUTER JOIN users 
                ON signatures.user_id = users.id 
                LEFT OUTER JOIN user_profiles 
                ON signatures.user_id = user_profiles.user_id 
                WHERE LOWER(city) = LOWER($1);`;
    const params = [city];            
    return db.query(q, params);
};

module.exports.getUser = (user_id) => {
    const q = `SELECT users.id,first,last,email,age,city,url 
                FROM users 
                FULL OUTER JOIN user_profiles 
                ON users.id = user_profiles.user_id 
                WHERE users.id=$1`;
    const params = [user_id];            
    return db.query(q, params);
};

module.exports.editUser = (user_id, firstName, lastName, email, password) => {
    const q = `
                UPDATE users 
                SET first=$2,last=$3,email=$4,password=$5  
                WHERE id=$1 
                `;
    const params = [user_id, firstName, lastName, email, password];
    return db.query(q, params);  
}

module.exports.editProfile = (user_id, age, city, homepage) => {
    const q = `INSERT INTO user_profiles 
                (user_id,age,city,url) VALUES ($1, $2, $3, $4) 
                ON CONFLICT (user_id) 
                DO UPDATE SET age=$2, city=$3, url=$4 
                `;
    const params = [user_id, age, city, homepage];
    return db.query(q, params);  
}

module.exports.deleteSignature = (user_id) => {
    const q = `
            DELETE FROM signatures 
            WHERE  user_id = $1
            `;
    const params = [user_id];
    return db.query(q, params);  
}

module.exports.deleteProfile = (user_id) => {
    const q = `
            DELETE FROM user_profiles 
            WHERE  user_id = $1
            `;
    const params = [user_id];
    return db.query(q, params);  
}

module.exports.deleteUser = (user_id) => {
    const q = `
            DELETE FROM users 
            WHERE  id = $1;

                `;
    const params = [user_id];
    return db.query(q, params);  
}