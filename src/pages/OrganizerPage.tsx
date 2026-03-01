import { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { supabase } from '../lib/supabase';
import { EventForm } from '../components/organizer/EventForm';
import { EventList } from '../components/organizer/EventList';
import { AuthModal } from '../components/auth/AuthModal';

export function OrganizerPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin';

  const fetchMyEvents = useCallback(async () => {
    if (!user) return;

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

      if (profile?.role === 'admin') {
        query = query.order('event_date', { ascending: false });
      } else {
        query = query.eq('organizer_id', user.id).order('event_date', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const eventsWithGenres = data?.map((event) => ({
        ...event,
        genres: event.genres?.map((eg) => eg.genre).filter(Boolean) || [],
      })) || [];

      setEvents(eventsWithGenres);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }

    if (isOrganizer) {
      fetchMyEvents();
    } else {
      setLoading(false);
    }
  }, [user, isOrganizer, fetchMyEvents]);

  const handleEventCreated = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    fetchMyEvents();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      fetchMyEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    setUpgrading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', user.id);

      if (error) throw error;

      window.location.reload();
    } catch (error) {
      console.error('Error upgrading account:', error);
      setError('Failed to upgrade account. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  if (!user) {
    return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        {profile && profile.role === 'public' && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Become an Event Organizer
                </h3>
                <p className="text-gray-700 mb-4">
                  Upgrade your account to create and manage entertainment events. Share your events with the community and reach a wider audience.
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Organizer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile?.role === 'admin' ? 'All Events' : 'My Events'}
            </h1>
            <p className="text-gray-600 mt-1">
              {profile?.role === 'admin'
                ? 'View and manage all organizer events'
                : isOrganizer
                ? 'Create and manage your entertainment events'
                : 'Upgrade to organizer to create events'}
            </p>
          </div>
          {isOrganizer && (
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          )}
        </div>

        {!isOrganizer ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
              <p className="text-gray-600">
                Upgrade to an organizer account to start creating and managing events.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <EventList
            events={events}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {showEventForm && (
          <EventForm
            event={editingEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onSuccess={handleEventCreated}
          />
        )}
      </div>
    </div>
  );
}
