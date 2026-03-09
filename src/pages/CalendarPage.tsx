import { useState, useEffect, useCallback, useRef } from 'react';
import { Filter, Calendar as CalendarIcon, List, ChevronDown } from 'lucide-react';
import { Event, EventFilters, CalendarView, UserPreferences } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance } from '../utils/geolocation';
import { WeekView } from '../components/calendar/WeekView';
import { MonthView } from '../components/calendar/MonthView';
import { RollingMonthView } from '../components/calendar/RollingMonthView';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { EventDetailModal } from '../components/calendar/EventDetailModal';

const VIEW_LABELS: Record<CalendarView, string> = {
  week: 'Week',
  month: 'Month',
  rolling: 'Rolling',
};

interface CalendarPageProps {
  selectedGenre?: string | null;
  onClearGenre?: () => void;
}

export function CalendarPage({ selectedGenre, onClearGenre }: CalendarPageProps) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filters, setFilters] = useState<EventFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isClickTriggered, setIsClickTriggered] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      fetchEvents(false);
    }
  }, [user]);

  useEffect(() => {
    if (preferences !== null || !user) {
      fetchEvents(preferences?.show_past_events || false);
    }
  }, [preferences, profile]);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  useEffect(() => {
    if (selectedGenre) {
      setFilters(prev => ({
        ...prev,
        genres: [selectedGenre]
      }));
    }
  }, [selectedGenre]);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setPreferences(data);
  };

  const fetchEvents = async (showPastEvents: boolean) => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          genres:event_genres(
            genre:genres(*)
          )
        `);

      if (profile?.role !== 'admin') {
        query = query.eq('status', 'approved');
      }

      if (!showPastEvents) {
        query = query.gte('event_date', new Date().toISOString().split('T')[0]);
      }

      query = query.order('event_date');

      const { data, error } = await query;

      if (error) throw error;

      const eventsWithGenres = data?.map((event: any) => ({
        ...event,
        genres: event.genres?.map((eg: any) => eg.genre).filter(Boolean) || [],
      })) || [];

      setEvents(eventsWithGenres);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...events];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(search) ||
          event.description?.toLowerCase().includes(search) ||
          event.city.toLowerCase().includes(search)
      );
    }

    if (filters.genres && filters.genres.length > 0) {
      filtered = filtered.filter((event) =>
        event.genres?.some((genre) => filters.genres!.includes(genre.id))
      );
    }

    if (filters.state) {
      filtered = filtered.filter((event) => event.state === filters.state);
    }

    if (filters.city) {
      filtered = filtered.filter((event) =>
        event.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters.zipCode) {
      filtered = filtered.filter((event) => event.zip_code === filters.zipCode);
    }

    if (filters.latitude && filters.longitude && filters.radius) {
      filtered = filtered
        .map((event) => {
          if (event.latitude && event.longitude) {
            const distance = calculateDistance(
              filters.latitude!,
              filters.longitude!,
              event.latitude,
              event.longitude
            );
            return { ...event, distance };
          }
          return event;
        })
        .filter((event) => event.distance !== undefined && event.distance <= filters.radius!);
    }

    if (filters.startDate) {
      filtered = filtered.filter((event) => event.event_date >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter((event) => event.event_date <= filters.endDate!);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((event) => (event.price || 0) >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((event) => (event.price || 0) <= filters.maxPrice!);
    }

    if (filters.ageLimit) {
      filtered = filtered.filter((event) => event.age_limit === filters.ageLimit);
    }

    setFilteredEvents(filtered);
  }, [events, filters]);

  const handleApplyFilters = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    if (preferences?.event_interaction_mode !== 'hover') {
      setIsClickTriggered(true);
      setSelectedEvent(event);
    }
  }, [preferences?.event_interaction_mode]);

  const handleEventHover = useCallback((event: Event | null) => {
    if (preferences?.event_interaction_mode === 'hover' && !isClickTriggered) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      if (event) {
        setHoveredEvent(event);

        hoverTimeoutRef.current = setTimeout(() => {
          setSelectedEvent(event);
        }, 3000);
      } else {
        transitionTimeoutRef.current = setTimeout(() => {
          setHoveredEvent(null);
        }, 1000);
      }
    }
  }, [preferences?.event_interaction_mode, isClickTriggered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {selectedGenre && onClearGenre && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Filtering by selected genre
            </p>
            <button
              onClick={() => {
                onClearGenre();
                setFilters(prev => {
                  const { genres: _, ...rest } = prev;
                  return rest;
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Clear filter
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Entertainment Calendar</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <div className="hidden md:flex items-center bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setCalendarView('week')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  calendarView === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Week
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors border-x border-gray-200 ${
                  calendarView === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Month
              </button>
              <button
                onClick={() => setCalendarView('rolling')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  calendarView === 'rolling'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                Rolling
              </button>
            </div>

            <div className="relative md:hidden" ref={viewDropdownRef}>
              <button
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium text-gray-700 border border-gray-200"
              >
                {calendarView === 'rolling' ? (
                  <List className="w-4 h-4" />
                ) : (
                  <CalendarIcon className="w-4 h-4" />
                )}
                {VIEW_LABELS[calendarView]}
                <ChevronDown className={`w-4 h-4 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isViewDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30">
                  {(['week', 'month', 'rolling'] as CalendarView[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setCalendarView(view);
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        calendarView === view
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {view === 'rolling' ? (
                        <List className="w-4 h-4" />
                      ) : (
                        <CalendarIcon className="w-4 h-4" />
                      )}
                      {VIEW_LABELS[view]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {calendarView === 'week' && (
              <WeekView
                events={filteredEvents}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={handleEventClick}
                onEventHover={handleEventHover}
              />
            )}
            {calendarView === 'month' && (
              <MonthView
                events={filteredEvents}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={handleEventClick}
                onEventHover={handleEventHover}
              />
            )}
            {calendarView === 'rolling' && (
              <RollingMonthView
                events={filteredEvents}
                onEventClick={handleEventClick}
                onEventHover={handleEventHover}
              />
            )}
          </>
        )}
      </div>

      {hoveredEvent && !selectedEvent && preferences?.event_interaction_mode === 'hover' && (
        <div
          className="fixed inset-0 z-40 pointer-events-none animate-in fade-in duration-300"
          style={{
            background: hoveredEvent.image_url
              ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${hoveredEvent.image_url})`
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >

          <div className="absolute bottom-8 left-8 right-8 max-w-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {hoveredEvent.title}
              </h3>
              {hoveredEvent.venue_name && (
                <p className="text-gray-600 mb-1">
                  {hoveredEvent.venue_name}
                </p>
              )}
              <p className="text-gray-500 text-sm">
                {hoveredEvent.city}, {hoveredEvent.state}
              </p>
              {hoveredEvent.genres && hoveredEvent.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {hoveredEvent.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-xs rounded-full text-white font-medium"
                      style={{ backgroundColor: genre.color }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 italic">
                Keep hovering to view full details...
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          displayMode={preferences?.event_display_mode || 'popup'}
          backgroundMode={preferences?.event_background_mode || 'white'}
          overlayOpacity={preferences?.overlay_opacity ?? 50}
          isClickTriggered={isClickTriggered}
          onClose={() => {
            setSelectedEvent(null);
            setHoveredEvent(null);
            setIsClickTriggered(false);
          }}
        />
      )}
    </div>
  );
}
