-- DROP TABLE IF EXISTS signers;


-- CREATE TABLE signers (
--     id         SERIAL PRIMARY KEY,
--     first_name       TEXT NOT NULL,
--     last_name       TEXT NOT NULL,
--     signature       TEXT NOT NULL
-- );

DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      first VARCHAR(255) NOT NULL,
      last VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE signatures(
      id SERIAL PRIMARY KEY,
      signature TEXT NOT NULL,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE user_profiles(
      id SERIAL PRIMARY KEY,
      age INT,
      city VARCHAR,
      url VARCHAR,
      user_id INT NOT NULL UNIQUE REFERENCES users(id)
      );