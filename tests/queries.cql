CREATE TABLE users (
    id uuid,
    name text,
    surname text,
    postal_code text,
    PRIMARY KEY (id)
);

CREATE INDEX name_index ON users(name);
CREATE INDEX surname_index ON users(surname);
