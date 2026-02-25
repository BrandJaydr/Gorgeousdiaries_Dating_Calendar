/*
  # Add Event Images and Create Upcoming Events

  1. Updates
    - Add images to existing events
    - Update event dates to be in the future

  2. New Events
    - Add 5 new upcoming events with images and future dates

  3. Details
    - All events have high-quality Pexels images
    - Events span from March 2026 to August 2026
    - Images are related to the event genres
*/

-- Update existing events with images and future dates
UPDATE events SET 
  image_url = 'https://images.pexels.com/photos/3707517/pexels-photo-3707517.jpeg?auto=compress&cs=tinysrgb&w=1200',
  event_date = '2026-03-15'
WHERE title = 'Summer Jazz Festival';

UPDATE events SET 
  image_url = 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=1200',
  event_date = '2026-04-10'
WHERE title = 'Comedy Night: Stand-Up Extravaganza';

UPDATE events SET 
  image_url = 'https://images.pexels.com/photos/3589794/pexels-photo-3589794.jpeg?auto=compress&cs=tinysrgb&w=1200',
  event_date = '2026-05-20'
WHERE title = 'Broadway Nights: Musical Theatre Showcase';

UPDATE events SET 
  image_url = 'https://images.pexels.com/photos/2676485/pexels-photo-2676485.jpeg?auto=compress&cs=tinysrgb&w=1200',
  event_date = '2026-06-12'
WHERE title = 'Rock Revolution: Battle of the Bands';

UPDATE events SET 
  image_url = 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=1200',
  event_date = '2026-07-08'
WHERE title = 'Classical Strings: Violin Concerto Evening';

-- Insert new upcoming events with images
INSERT INTO events (title, description, event_date, event_time, venue_name, address, city, state, zip_code, latitude, longitude, price, image_url, status, featured)
VALUES 
  ('Electronic Music Festival 2026', 'The ultimate electronic music experience featuring world-renowned DJs and producers', '2026-03-28', '20:00:00', 'Downtown Arena', '500 Main St', 'Los Angeles', 'CA', '90001', 34.0522, -118.2437, 75.00, 'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=1200', 'approved', true),
  ('Hip-Hop Night: Urban Beats Showcase', 'Experience the hottest hip-hop artists from the underground scene', '2026-04-25', '21:00:00', 'The Fillmore', '1805 Geary Blvd', 'San Francisco', 'CA', '94115', 37.7749, -122.4194, 55.00, 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200', 'approved', true),
  ('Country Music Fest', 'A celebration of traditional and modern country music with leading artists', '2026-05-30', '19:00:00', 'Outdoor Amphitheater', '123 Music Drive', 'Nashville', 'TN', '37201', 36.1627, -86.7816, 65.00, 'https://images.pexels.com/photos/3998102/pexels-photo-3998102.jpeg?auto=compress&cs=tinysrgb&w=1200', 'approved', true),
  ('Indie Rock Showcase', 'Discover emerging indie rock bands pushing the boundaries of modern music', '2026-06-28', '20:30:00', 'The Beacon Theatre', '2124 Broadway', 'New York', 'NY', '10023', 40.7705, -73.9776, 60.00, 'https://images.pexels.com/photos/2584270/pexels-photo-2584270.jpeg?auto=compress&cs=tinysrgb&w=1200', 'approved', true),
  ('Reggae & Dancehall Festival', 'Feel the Caribbean vibes with reggae and dancehall music all night long', '2026-07-25', '18:00:00', 'Beachfront Pavilion', '1 Ocean Drive', 'Miami', 'FL', '33139', 25.7617, -80.1918, 50.00, 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=1200', 'approved', false);