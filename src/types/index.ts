export interface Genre {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  color: string;
  description: string | null;
  created_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  domain: string;
  created_at: string;
}

export interface EventSeries {
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
  category?: EventCategory;
}

export interface Event {
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
  genres?: Genre[];
  category?: EventCategory;
  tags?: Tag[];
  series?: EventSeries;
  distance?: number;
}

export interface EventFilters {
  search?: string;
  genres?: string[];
  categoryId?: string;
  tagIds?: string[];
  state?: string;
  city?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  ageLimit?: string;
  dressCode?: string;
  featured?: boolean;
  seriesId?: string;
}

export type CalendarView = 'week' | 'month' | 'rolling';

export type EventInteractionMode = 'click' | 'hover';
export type EventDisplayMode = 'popup' | 'overlay' | 'fullpage';
export type EventBackgroundMode = 'image' | 'white' | 'blur';

export interface LocationData {
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface UserPreferences {
  user_id: string;
  show_past_events: boolean;
  calendar_sync_google: boolean;
  calendar_sync_apple: boolean;
  calendar_sync_outlook: boolean;
  calendar_sync_yahoo: boolean;
  calendar_sync_ical: boolean;
  menu_interaction_mode: 'click' | 'hover';
  menu_overlay_enabled: boolean;
  event_interaction_mode: EventInteractionMode;
  event_display_mode: EventDisplayMode;
  event_background_mode: EventBackgroundMode;
  overlay_opacity: number;
  created_at: string;
  updated_at: string;
}
