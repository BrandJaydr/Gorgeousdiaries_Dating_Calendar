import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'public' | 'organizer' | 'admin';
          subscription_tier: 'free' | 'organizer' | 'premium';
          default_location: string | null;
          default_city: string | null;
          default_state: string | null;
          default_zip_code: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      genres: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon_name: string | null;
          color: string;
          description: string | null;
          created_at: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          end_date: string | null;
          end_time: string | null;
          venue_name: string | null;
          address: string;
          city: string;
          state: string;
          zip_code: string | null;
          latitude: number | null;
          longitude: number | null;
          price: number | null;
          dress_code: string | null;
          age_limit: string | null;
          phone_number: string | null;
          image_url: string | null;
          organizer_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_genres: {
        Row: {
          event_id: string;
          genre_id: string;
        };
      };
    };
  };
}
