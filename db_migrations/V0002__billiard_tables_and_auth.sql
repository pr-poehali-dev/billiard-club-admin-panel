CREATE TABLE IF NOT EXISTS billiard_tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    table_type VARCHAR(100) NOT NULL DEFAULT 'Русская пирамида',
    size_ft INTEGER NOT NULL DEFAULT 12,
    price_per_hour INTEGER NOT NULL DEFAULT 700,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO billiard_tables (name, table_type, size_ft, price_per_hour, sort_order) VALUES
    ('Стол №1', 'Русская пирамида', 12, 700, 1),
    ('Стол №2', 'Русская пирамида', 12, 700, 2),
    ('Стол №3', 'Пул', 9, 600, 3),
    ('Стол №4', 'Пул', 9, 600, 4),
    ('Стол №5', 'Снукер', 12, 850, 5),
    ('VIP Стол', 'Русская пирамида', 12, 1200, 6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO admin_users (username, password_hash)
VALUES ('admin', 'admin123')
ON CONFLICT DO NOTHING;