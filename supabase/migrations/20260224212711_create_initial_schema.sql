/*
  # Entertainment Calendar Database Schema

  ## Overview
  Creates the complete database schema for the entertainment calendar SaaS application
  with AI-powered event management, location-based filtering, and subscription tiers.

  ## Tables Created

  1. **users** - Extended user profiles with subscription and location preferences
     - id (uuid, references auth.users)
     - email (text)
     - full_name (text)
     - role (text: 'public', 'organizer', 'admin')
     - subscription_tier (text: 'free', 'organizer', 'premium')
     - default_location (text)
     - default_city (text)
     - default_state (text)
     - default_zip_code (text)
     - latitude (numeric)
     - longitude (numeric)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  2. **genres** - Entertainment categories
     - id (uuid)
     - name (text: Boxing, MMA, Sports, Wrestling, Jazz, Kids Events, etc.)
     - slug (text)
     - icon_name (text)
     - color (text)
     - description (text)
     - created_at (timestamptz)

  3. **events** - Main events table
     - id (uuid)
     - title (text)
     - description (text)
     - event_date (date)
     - event_time (time)
     - end_date (date, nullable)
     - end_time (time, nullable)
     - venue_name (text)
     - address (text)
     - city (text)
     - state (text)
     - zip_code (text)
     - latitude (numeric)
     - longitude (numeric)
     - price (numeric, nullable)
     - dress_code (text, nullable)
     - age_limit (text, nullable)
     - phone_number (text, nullable)
     - image_url (text, nullable)
     - organizer_id (uuid, nullable)
     - status (text: 'pending', 'approved', 'rejected')
     - featured (boolean)
     - created_at (timestamptz)
     - updated_at (timestamptz)

  4. **event_genres** - Many-to-many relationship between events and genres
     - event_id (uuid)
     - genre_id (uuid)

  5. **csv_imports** - Track CSV/Excel imports
     - id (uuid)
     - filename (text)
     - file_url (text)
     - state (text)
     - genre (text)
     - status (text: 'processing', 'pending_approval', 'approved', 'rejected')
     - total_rows (integer)
     - processed_rows (integer)
     - approved_rows (integer)
     - uploaded_by (uuid)
     - created_at (timestamptz)
     - processed_at (timestamptz, nullable)

  6. **user_favorites** - User saved events
     - user_id (uuid)
     - event_id (uuid)
     - created_at (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public can read approved events
  - Organizers can create and edit their own events
  - Admins have full access
  - Users can manage their own profiles and favorites
*/

-- Enable PostGIS extension for geographic calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'organizer', 'admin')),
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'organizer', 'premium')),
  default_location text,
  default_city text,
  default_state text,
  default_zip_code text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon_name text,
  color text DEFAULT '#3b82f6',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  end_date date,
  end_time time,
  venue_name text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text,
  latitude numeric,
  longitude numeric,
  price numeric,
  dress_code text,
  age_limit text,
  phone_number text,
  image_url text,
  organizer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_genres junction table
CREATE TABLE IF NOT EXISTS event_genres (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  genre_id uuid REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, genre_id)
);

-- Create csv_imports table
CREATE TABLE IF NOT EXISTS csv_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_url text,
  state text,
  genre text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'pending_approval', 'approved', 'rejected')),
  total_rows integer DEFAULT 0,
  processed_rows integer DEFAULT 0,
  approved_rows integer DEFAULT 0,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_state ON events(state);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_genres_event ON event_genres(event_id);
CREATE INDEX IF NOT EXISTS idx_event_genres_genre ON event_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_status ON csv_imports(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for genres table
CREATE POLICY "Anyone can view genres"
  ON genres FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage genres"
  ON genres FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for events table
CREATE POLICY "Anyone can view approved events"
  ON events FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('organizer', 'admin')
    )
    AND organizer_id = auth.uid()
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for event_genres table
CREATE POLICY "Anyone can view event genres"
  ON event_genres FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can manage event genres"
  ON event_genres FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_genres.event_id
      AND (
        events.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

-- RLS Policies for csv_imports table
CREATE POLICY "Admins can view all imports"
  ON csv_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage imports"
  ON csv_imports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for user_favorites table
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default genres
INSERT INTO genres (name, slug, icon_name, color, description) VALUES
  ('Boxing', 'boxing', 'Gauge', '#ef4444', 'Professional and amateur boxing matches'),
  ('MMA', 'mma', 'Swords', '#f59e0b', 'Mixed Martial Arts events and fights'),
  ('Sports', 'sports', 'Trophy', '#10b981', 'Various sporting events and competitions'),
  ('Wrestling', 'wrestling', 'Users', '#3b82f6', 'Professional wrestling and entertainment'),
  ('Jazz', 'jazz', 'Music', '#8b5cf6', 'Jazz concerts and live music performances'),
  ('Kids Events', 'kids-events', 'Baby', '#ec4899', 'Family-friendly and children activities'),
  ('Grand Openings', 'grand-openings', 'Store', '#06b6d4', 'New business and venue openings'),
  ('Comedy', 'comedy', 'Laugh', '#eab308', 'Stand-up comedy and comedy shows'),
  ('Theater', 'theater', 'Drama', '#6366f1', 'Theatrical performances and plays'),
  ('Concerts', 'concerts', 'Music2', '#14b8a6', 'Live music concerts and festivals'),
  ('Food & Drink', 'food-drink', 'Utensils', '#f97316', 'Food festivals and culinary events'),
  ('Community', 'community', 'Users2', '#84cc16', 'Community gatherings and local events')
ON CONFLICT (name) DO NOTHING;
