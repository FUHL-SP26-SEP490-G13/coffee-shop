-- Add province_id and ward_id to addresses table, then create foreign keys
-- Idempotent script: safe to run multiple times

SET @schema_name = DATABASE();

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND COLUMN_NAME = 'province_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD COLUMN province_id INT NULL AFTER address'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND COLUMN_NAME = 'ward_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD COLUMN ward_id INT NULL AFTER province_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND INDEX_NAME = 'idx_addresses_province_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD INDEX idx_addresses_province_id (province_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND INDEX_NAME = 'idx_addresses_ward_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD INDEX idx_addresses_ward_id (ward_id)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND CONSTRAINT_NAME = 'fk_addresses_province_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD CONSTRAINT fk_addresses_province_id FOREIGN KEY (province_id) REFERENCES provinces(id) ON UPDATE CASCADE ON DELETE SET NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = @schema_name
      AND TABLE_NAME = 'addresses'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND CONSTRAINT_NAME = 'fk_addresses_ward_id'
  ),
  'SELECT 1',
  'ALTER TABLE addresses ADD CONSTRAINT fk_addresses_ward_id FOREIGN KEY (ward_id) REFERENCES wards(id) ON UPDATE CASCADE ON DELETE SET NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
