CREATE TABLE users (
    id timeuuid,
    name text,
    surname text,
    stamp timestamp,
    PRIMARY KEY (id, stamp)
);

CREATE INDEX name_index ON users(name);
CREATE INDEX surname_index ON users(surname);