import { useState, useEffect } from 'react';
import { Check, X, Upload, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { supabase } from '../lib/supabase';
import { EventCard } from '../components/calendar/EventCard';
import { CSVUploader } from '../components/admin/CSVUploader';
import { UserManagement } from '../components/admin/UserManagement';

export function AdminPage() {
  const { profile } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'csv' | 'users'>('events');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingEvents();
    }
  }, [profile]);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          genres:event_genres(
            genre:genres(*)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsWithGenres = data?.map((event: any) => ({
        ...event,
        genres: event.genres?.map((eg: any) => eg.genre).filter(Boolean) || [],
      })) || [];

      setPendingEvents(eventsWithGenres);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'approved' })
        .eq('id', eventId);

      if (error) throw error;
      fetchPendingEvents();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleReject = async (eventId: string) => {
    if (!confirm('Are you sure you want to reject this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'rejected' })
        .eq('id', eventId);

      if (error) throw error;
      fetchPendingEvents();
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage events, CSV imports, and users</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Welcome, Administrator
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                You have full system access with premium features enabled. Use the tabs below to manage events, import data via CSV, and control user permissions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Approve Events
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  CSV Import
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  User Management
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Feature Events
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending Events ({pendingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'csv'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                CSV Import
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                User Management
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'events' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No pending events to review</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="relative">
                    <EventCard event={event} />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleApprove(event.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(event.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'csv' && <CSVUploader onImportComplete={fetchPendingEvents} />}

        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
}
