-- Добавляем новые поля в таблицу столов
ALTER TABLE billiard_tables
    ADD COLUMN IF NOT EXISTS model VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS controller_id VARCHAR(100) NOT NULL DEFAULT '';

-- Добавляем поле места оплаты в бронирования
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS payment_place VARCHAR(50) NOT NULL DEFAULT 'В клубе';

-- Добавляем поле баланса в настройки клуба
ALTER TABLE club_settings
    ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0;