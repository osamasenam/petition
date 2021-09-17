DROP TABLE IF EXISTS signers;


CREATE TABLE signers (
    id         SERIAL PRIMARY KEY,
    first_name       TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    signature       TEXT NOT NULL
);
