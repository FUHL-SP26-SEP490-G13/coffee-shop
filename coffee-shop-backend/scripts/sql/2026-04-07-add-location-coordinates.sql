-- Add store/customer coordinate support for shipping calculations

ALTER TABLE receipt_settings
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER address,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
  ADD COLUMN location_source ENUM('manual_pin','gps','geocode','imported') NULL AFTER longitude,
  ADD COLUMN location_verified_at DATETIME NULL AFTER location_source;

ALTER TABLE addresses
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER address,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
  ADD COLUMN location_source ENUM('manual_pin','gps','geocode','imported') NULL AFTER longitude,
  ADD COLUMN location_verified_at DATETIME NULL AFTER location_source;

ALTER TABLE order_delivery_info
  ADD COLUMN store_latitude DECIMAL(10,7) NULL AFTER note,
  ADD COLUMN store_longitude DECIMAL(10,7) NULL AFTER store_latitude,
  ADD COLUMN customer_latitude DECIMAL(10,7) NULL AFTER store_longitude,
  ADD COLUMN customer_longitude DECIMAL(10,7) NULL AFTER customer_latitude,
  ADD COLUMN coordinates_source ENUM('manual_pin','gps','geocode') NULL AFTER customer_longitude;

CREATE INDEX idx_receipt_settings_location ON receipt_settings (is_active, latitude, longitude);
CREATE INDEX idx_addresses_location ON addresses (user_id, is_deleted, latitude, longitude);
