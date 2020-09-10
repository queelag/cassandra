CREATE TYPE user_billing (
    "address" text,
    "cards" set<uuid>,
    "postal_code" text
);

CREATE TABLE users (
    "id" uuid,
    "name" text,
    "surname" text,
    "bb_pin" text,
    "billings" set<frozen<user_billing>>,
    "timestamp" timestamp,
    PRIMARY KEY ("id")
);

CREATE INDEX name_index ON users(name);
CREATE INDEX surname_index ON users(surname);
