/*
  # Insert Dummy Events for February 2026
  
  Populates the events table with test events for every day in February 2026.
  Each event has complete data including venue information, pricing, and genres.
  
  1. Events Generated
     - 28 events (one per day in February 2026)
     - Mix of genres: Boxing, MMA, Sports, Jazz, Comedy, Concerts, Theater
     - Varied pricing from $15 to $150
     - Multiple cities: New York, Los Angeles, Chicago, Miami, Boston
     - Status: approved (visible in calendar)
     - Varied times throughout the day
  
  2. Event Details
     - All events have complete address information
     - Geographic coordinates for location-based filtering
     - Diverse venue names (arenas, theaters, clubs, studios)
     - Mix of dress codes and age restrictions
     - Some marked as featured
*/

DO $$
DECLARE
  boxing_id uuid;
  mma_id uuid;
  sports_id uuid;
  jazz_id uuid;
  comedy_id uuid;
  concerts_id uuid;
  theater_id uuid;
  event_date date;
  event_idx integer;
  current_event_id uuid;
  cities text[] := ARRAY['New York', 'Los Angeles', 'Chicago', 'Miami', 'Boston'];
  states text[] := ARRAY['NY', 'CA', 'IL', 'FL', 'MA'];
  venues text[] := ARRAY['Madison Square Garden', 'Crypto.com Arena', 'United Center', 'American Airlines Center', 'TD Garden', 'Barclays Center', 'Forum', 'Staples Center', 'Chicago Theater', 'Tower Theater'];
  addresses text[] := ARRAY['33 Penn Plaza', '1111 S Figueroa St', '1901 W Madison St', '601 E Market St', '100 Legends Way', '620 Atlantic Ave', '3900 W Manchester Ave', '1111 S Figueroa St', '3526 N Sheffield Ave', '6415 Hollywood Blvd'];
  zip_codes text[] := ARRAY['10001', '90015', '60612', '33010', '02215', '11217', '90003', '90015', '60657', '90028'];
  titles text[] := ARRAY['Championship Boxing Night', 'MMA Heavyweight Battle', 'Professional Basketball Game', 'Jazz Fusion Concert', 'Comedy Club Evening', 'Live Concert Series', 'Broadway Theater Show', 'Championship Wrestling', 'Olympic Sports Event', 'Music Festival'];
  prices numeric[] := ARRAY[49.99, 75.00, 85.00, 65.00, 35.00, 95.00, 55.00, 65.00, 45.00, 120.00, 150.00, 25.00, 40.00, 60.00];
BEGIN
  SELECT id INTO boxing_id FROM genres WHERE slug = 'boxing';
  SELECT id INTO mma_id FROM genres WHERE slug = 'mma';
  SELECT id INTO sports_id FROM genres WHERE slug = 'sports';
  SELECT id INTO jazz_id FROM genres WHERE slug = 'jazz';
  SELECT id INTO comedy_id FROM genres WHERE slug = 'comedy';
  SELECT id INTO concerts_id FROM genres WHERE slug = 'concerts';
  SELECT id INTO theater_id FROM genres WHERE slug = 'theater';
  
  FOR event_idx IN 1..28 LOOP
    event_date := '2026-02-01'::date + (event_idx - 1);
    
    INSERT INTO events (
      title,
      description,
      event_date,
      event_time,
      venue_name,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      price,
      dress_code,
      age_limit,
      phone_number,
      status,
      featured,
      created_at,
      updated_at
    ) VALUES (
      titles[(event_idx % array_length(titles, 1)) + 1],
      'Join us for an exciting entertainment event. Limited seating available. Book your tickets today for an unforgettable experience.',
      event_date,
      ('19:00:00'::time + (event_idx % 6 || ' hours')::interval)::time,
      venues[(event_idx % array_length(venues, 1)) + 1],
      addresses[(event_idx % array_length(addresses, 1)) + 1],
      cities[(event_idx % array_length(cities, 1)) + 1],
      states[(event_idx % array_length(states, 1)) + 1],
      zip_codes[(event_idx % array_length(zip_codes, 1)) + 1],
      40.7128 + (RANDOM() - 0.5) * 10,
      -74.0060 + (RANDOM() - 0.5) * 10,
      prices[(event_idx % array_length(prices, 1)) + 1],
      CASE (event_idx % 4)
        WHEN 0 THEN 'Business Casual'
        WHEN 1 THEN 'Formal'
        WHEN 2 THEN 'Smart Casual'
        ELSE 'Casual'
      END,
      CASE (event_idx % 3)
        WHEN 0 THEN '18+'
        WHEN 1 THEN '21+'
        ELSE NULL
      END,
      '+1-' || (200 + event_idx) || '-' || (500 + event_idx) || '-' || (1000 + event_idx),
      'approved',
      event_idx % 5 = 0,
      now(),
      now()
    ) RETURNING id INTO current_event_id;
    
    INSERT INTO event_genres (event_id, genre_id)
    VALUES (
      current_event_id,
      CASE (event_idx % 7)
        WHEN 1 THEN boxing_id
        WHEN 2 THEN mma_id
        WHEN 3 THEN sports_id
        WHEN 4 THEN jazz_id
        WHEN 5 THEN comedy_id
        WHEN 6 THEN concerts_id
        ELSE theater_id
      END
    );
  END LOOP;
END $$;
