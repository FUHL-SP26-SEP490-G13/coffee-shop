-- Loyalty points schema
CREATE TABLE IF NOT EXISTS user_loyalities (
  user_id INT PRIMARY KEY,
  total_points INT NOT NULL DEFAULT 0,
  lifetime_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_total_points CHECK (total_points >= 0),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('EARN', 'SPEND', 'REFUND', 'ADJUST') NOT NULL,
  points INT NOT NULL,
  source VARCHAR(50) NOT NULL,
  reference_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS used_points INT NOT NULL DEFAULT 0;

CREATE INDEX idx_pt_user ON point_transactions(user_id);
CREATE INDEX idx_pt_ref ON point_transactions(reference_id);
