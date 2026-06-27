CREATE TABLE IF NOT EXISTS club_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    address VARCHAR(500) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    website VARCHAR(255) NOT NULL DEFAULT '',
    work_hours VARCHAR(255) NOT NULL DEFAULT '',
    telegram VARCHAR(255) NOT NULL DEFAULT '',
    instagram VARCHAR(255) NOT NULL DEFAULT '',
    vk VARCHAR(255) NOT NULL DEFAULT '',
    max_messenger VARCHAR(255) NOT NULL DEFAULT '',
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO club_settings (id, name, description, address, phone, work_hours, telegram, instagram, vk)
VALUES (
    1,
    'Кий&Лузы',
    'Уютный бильярдный клуб в центре города. 8 профессиональных столов, бар и приятная атмосфера для игры в любое время суток.',
    'г. Москва, ул. Пушкина, д. 12',
    '+7 (495) 123-45-67',
    'Ежедневно 10:00 – 02:00',
    '@kiy_luzy',
    'kiy.luzy',
    'vk.com/kiyluzy'
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    table_id INTEGER NOT NULL,
    table_name VARCHAR(100) NOT NULL DEFAULT '',
    booking_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    client_name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'Подтверждено',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_table_date ON bookings (table_id, booking_date);