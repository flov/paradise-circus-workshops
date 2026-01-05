-- Insert sample workshops
INSERT INTO workshops (title, description, instructor, date, start_time, end_time, max_capacity, location) VALUES
  ('Aerial Silks Beginner', 'Learn the basics of aerial silks with our expert instructors. Perfect for first-timers!', 'Sarah Martinez', CURRENT_DATE + INTERVAL '7 days', '10:00', '12:00', 15, 'Studio A'),
  ('Trapeze Fundamentals', 'Discover the art of flying trapeze in a safe, supportive environment.', 'James Chen', CURRENT_DATE + INTERVAL '7 days', '14:00', '16:00', 12, 'Main Arena'),
  ('Juggling Workshop', 'Master the basics of juggling with balls, clubs, and more!', 'Maria Lopez', CURRENT_DATE + INTERVAL '8 days', '10:00', '11:30', 20, 'Studio B'),
  ('Acrobatics for Adults', 'Build strength and flexibility while learning acrobatic skills.', 'Tom Williams', CURRENT_DATE + INTERVAL '8 days', '13:00', '15:00', 16, 'Studio A'),
  ('Contortion Basics', 'Explore flexibility and body control in this beginner-friendly class.', 'Elena Petrov', CURRENT_DATE + INTERVAL '9 days', '11:00', '13:00', 10, 'Studio C'),
  ('Partner Acrobatics', 'Learn to balance, lift, and fly with a partner in this dynamic workshop.', 'Sarah Martinez', CURRENT_DATE + INTERVAL '9 days', '15:00', '17:00', 14, 'Main Arena'),
  ('Clowning & Physical Comedy', 'Discover your inner clown and learn the art of physical comedy.', 'Charlie Brooks', CURRENT_DATE + INTERVAL '10 days', '10:00', '12:00', 18, 'Studio B'),
  ('Aerial Hoop Intermediate', 'Take your aerial hoop skills to the next level.', 'James Chen', CURRENT_DATE + INTERVAL '10 days', '14:00', '16:00', 12, 'Studio A');
