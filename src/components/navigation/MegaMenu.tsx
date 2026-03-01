import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Menu, X, User, LogOut, Settings, FileText, Shield } from 'lucide-react';
import { Genre, Event, UserPreferences } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MegaMenuProps {
  onGenreSelect: (genreId: string) => void;
  onViewChange: (view: 'calendar' | 'organizer' | 'admin' | 'settings') => void;
  currentView: string;
}

export function MegaMenu({ onGenreSelect, onViewChange, currentView }: MegaMenuProps) {
  const { user, profile, signOut } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [hoveredGenre, setHoveredGenre] = useState<Genre | null>(null);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchGenres = useCallback(async () => {
    const { data } = await supabase.from('genres').select('*').order('name');
    if (data) setGenres(data);
  }, []);

  const fetchFeaturedEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .eq('featured', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date')
      .limit(6);

    if (data) setFeaturedEvents(data);
  }, []);

  const fetchPreferencesCallback = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) setPreferences(data);
  }, [user]);

  useEffect(() => {
    fetchGenres();
    fetchFeaturedEvents();
    fetchPreferencesCallback();
  }, [fetchGenres, fetchFeaturedEvents, fetchPreferencesCallback]);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const handleMenuMouseEnter = () => {
    if (preferences?.menu_interaction_mode === 'hover') {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
      setIsMenuOpen(true);
    }
  };

  const handleMenuMouseLeave = () => {
    if (preferences?.menu_interaction_mode === 'hover') {
      menuTimeoutRef.current = setTimeout(() => {
        setIsMenuOpen(false);
      }, 300);
    }
  };

  const handleUserMenuMouseEnter = () => {
    if (preferences?.menu_interaction_mode === 'hover') {
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
      }
      setIsUserMenuOpen(true);
    }
  };

  const handleUserMenuMouseLeave = () => {
    if (preferences?.menu_interaction_mode === 'hover') {
      userMenuTimeoutRef.current = setTimeout(() => {
        setIsUserMenuOpen(false);
      }, 300);
    }
  };

  const handleMenuClick = () => {
    if (preferences?.menu_interaction_mode !== 'hover') {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  const handleUserMenuClick = () => {
    if (preferences?.menu_interaction_mode !== 'hover') {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  const handleMobileMenuClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {((preferences?.menu_overlay_enabled && isMenuOpen) || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={() => {
            setIsMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
      <nav className="bg-white shadow-lg relative z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 cursor-pointer flex-shrink-0"
                onClick={() => onViewChange('calendar')}
              >
                <Calendar className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
                <span className="text-sm md:text-xl font-bold text-gray-900">EventCal</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <div
                className="flex items-center"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  onClick={handleMenuClick}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                  <span className="font-medium">Browse Events</span>
                </button>
              </div>

              <button
                onClick={() => onViewChange('calendar')}
                className={`px-4 py-2 font-medium transition-colors ${
                  currentView === 'calendar'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Calendar
              </button>

              {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                <button
                  onClick={() => onViewChange('organizer')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    currentView === 'organizer'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  My Events
                </button>
              )}

              {profile?.role === 'admin' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    currentView === 'admin'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {user ? (
                <div
                  className="relative"
                  onMouseEnter={handleUserMenuMouseEnter}
                  onMouseLeave={handleUserMenuMouseLeave}
                >
                  <button
                    onClick={handleUserMenuClick}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block text-sm">{profile?.full_name || user.email?.split('@')[0] || 'Account'}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                        <button
                          onClick={() => {
                            onViewChange('organizer');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          My Events
                        </button>
                      )}
                      {profile?.role === 'admin' && (
                        <button
                          onClick={() => {
                            onViewChange('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onViewChange('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onViewChange('organizer')}
                  className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 pt-4 space-y-2">
              <button
                onClick={() => handleMobileMenuClick(() => onViewChange('calendar'))}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Calendar</span>
              </button>

              <button
                onClick={() => handleMobileMenuClick(handleMenuClick)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span className="font-medium">Browse Events</span>
              </button>

              {(profile?.role === 'organizer' || profile?.role === 'admin') && (
                <button
                  onClick={() => handleMobileMenuClick(() => onViewChange('organizer'))}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    currentView === 'organizer'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">My Events</span>
                </button>
              )}

              {profile?.role === 'admin' && (
                <button
                  onClick={() => handleMobileMenuClick(() => onViewChange('admin'))}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    currentView === 'admin'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </button>
              )}

              {user && (
                <button
                  onClick={() => handleMobileMenuClick(() => onViewChange('settings'))}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    currentView === 'settings'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
              )}
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div
            className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-200 hidden md:block z-40"
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-4 gap-8">
                <div className="col-span-3">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Entertainment Categories</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        onMouseEnter={() => setHoveredGenre(genre)}
                        onClick={() => {
                          onGenreSelect(genre.id);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: genre.color + '20' }}
                        >
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: genre.color }}
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {genre.name}
                          </div>
                          <div className="text-xs text-gray-600">{genre.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-l border-gray-200 pl-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Featured Events</h3>
                  <div className="space-y-3">
                    {featuredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="font-semibold text-sm text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {event.city}, {event.state}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {hoveredGenre && hoveredGenre.description && (
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 pointer-events-none transition-opacity duration-300"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${hoveredGenre.color}15, transparent)`,
                }}
              />
            )}
          </div>
        )}
      </nav>
    </>
  );
}
