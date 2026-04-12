CREATE TABLE IF NOT EXISTS provinces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_provinces_name (name)
);

CREATE TABLE IF NOT EXISTS wards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  province_id INT NOT NULL,
  shipping_fee INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_wards_name_province (name, province_id),
  KEY idx_wards_province_id (province_id),
  KEY idx_wards_active (is_active),
  KEY idx_wards_shipping_fee (shipping_fee)
);
