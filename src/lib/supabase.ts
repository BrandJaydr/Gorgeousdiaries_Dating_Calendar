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
      event_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon_name: string | null;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['event_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['event_categories']['Insert']>;
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          domain: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
      };
      event_series: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          organizer_name: string | null;
          organizer_id: string | null;
          website: string | null;
          image_url: string | null;
          category_id: string | null;
          founded_year: number | null;
          frequency: 'annual' | 'biannual' | 'monthly' | 'irregular';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['event_series']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['event_series']['Insert']>;
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
          organizer_name: string | null;
          website: string | null;
          ticket_url: string | null;
          source_url: string | null;
          last_verified: string | null;
          notes: string | null;
          verified: boolean;
          duplicate_check: boolean;
          status: 'pending' | 'approved' | 'rejected' | 'archived';
          featured: boolean;
          category_id: string | null;
          series_id: string | null;
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
      event_tags: {
        Row: {
          event_id: string;
          tag_id: string;
        };
      };
    };
  };
}
