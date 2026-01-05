-- Create workshops table
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 20,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  notes TEXT,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workshops_date ON workshops(date);
CREATE INDEX IF NOT EXISTS idx_bookings_workshop_id ON bookings(workshop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(participant_email);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES 
  ('admin_email', 'admin@paradisecircus.com'),
  ('booking_confirmation_enabled', 'true'),
  ('max_advance_booking_days', '90')
ON CONFLICT (setting_key) DO NOTHING;
