import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Mail, Shield, Bell, Lock, Upload, Calendar, Trash2, AlertTriangle, MousePointer, Eye, Maximize2, Image } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPreferences, EventInteractionMode, EventDisplayMode, EventBackgroundMode } from '../types';

export function SettingsPage() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const fetchPreferencesCallback = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (data) {
      setPreferences(data);
    } else {
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (!insertError && newPrefs) {
        setPreferences(newPrefs);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPreferencesCallback();
    }
  }, [user, fetchPreferencesCallback]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      const { data: updatedProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (updatedProfile) {
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToOrganizer = async () => {
    if (!user || profile?.role === 'organizer' || profile?.role === 'admin') return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Successfully upgraded to organizer! You can now create events.' });
    } catch (error) {
      console.error('Error upgrading account:', error);
      setMessage({ type: 'error', text: 'Failed to upgrade account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: 'Please upload a CSV or Excel file.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('csv-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('csv-uploads')
        .getPublicUrl(fileName);

      await supabase.from('csv_imports').insert({
        filename: file.name,
        file_url: urlData.publicUrl,
        uploaded_by: user.id,
        status: 'processing'
      });

      setMessage({ type: 'success', text: 'File uploaded successfully! It will be processed shortly.' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Failed to upload file. Please try again.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTogglePastEvents = async () => {
    if (!user || !preferences) return;

    const newValue = !preferences.show_past_events;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ show_past_events: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, show_past_events: newValue });
      setMessage({ type: 'success', text: `Past events are now ${newValue ? 'visible' : 'hidden'}.` });
    } catch (error) {
      console.error('Error updating preference:', error);
      setMessage({ type: 'error', text: 'Failed to update preference.' });
    }
  };

  const handleCalendarSync = async (provider: 'google' | 'apple' | 'outlook' | 'yahoo' | 'ical') => {
    if (!user || !preferences) return;

    const key = `calendar_sync_${provider}` as keyof UserPreferences;
    const currentValue = preferences[key] as boolean;
    const newValue = !currentValue;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ [key]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, [key]: newValue });

      if (newValue) {
        setMessage({ type: 'success', text: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar sync enabled. You will receive calendar invites for saved events.` });
      } else {
        setMessage({ type: 'success', text: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar sync disabled.` });
      }
    } catch (error) {
      console.error('Error updating calendar sync:', error);
      setMessage({ type: 'error', text: 'Failed to update calendar sync.' });
    }
  };

  const handleMenuInteractionMode = async (mode: 'click' | 'hover') => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ menu_interaction_mode: mode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, menu_interaction_mode: mode });
      setMessage({ type: 'success', text: `Menu interaction mode set to ${mode}.` });
    } catch (error) {
      console.error('Error updating menu mode:', error);
      setMessage({ type: 'error', text: 'Failed to update menu preferences.' });
    }
  };

  const handleMenuOverlay = async () => {
    if (!user || !preferences) return;

    const newValue = !preferences.menu_overlay_enabled;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ menu_overlay_enabled: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, menu_overlay_enabled: newValue });
      setMessage({ type: 'success', text: `Menu overlay ${newValue ? 'enabled' : 'disabled'}.` });
    } catch (error) {
      console.error('Error updating menu overlay:', error);
      setMessage({ type: 'error', text: 'Failed to update menu preferences.' });
    }
  };

  const handleEventInteractionMode = async (mode: EventInteractionMode) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ event_interaction_mode: mode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, event_interaction_mode: mode });
      setMessage({ type: 'success', text: `Event interaction mode set to ${mode}.` });
    } catch (error) {
      console.error('Error updating event interaction mode:', error);
      setMessage({ type: 'error', text: 'Failed to update event display preferences.' });
    }
  };

  const handleEventDisplayMode = async (mode: EventDisplayMode) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ event_display_mode: mode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, event_display_mode: mode });
      setMessage({ type: 'success', text: `Event display mode set to ${mode}.` });
    } catch (error) {
      console.error('Error updating event display mode:', error);
      setMessage({ type: 'error', text: 'Failed to update event display preferences.' });
    }
  };

  const handleEventBackgroundMode = async (mode: EventBackgroundMode) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ event_background_mode: mode, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, event_background_mode: mode });
      setMessage({ type: 'success', text: `Event background mode set to ${mode}.` });
    } catch (error) {
      console.error('Error updating event background mode:', error);
      setMessage({ type: 'error', text: 'Failed to update event display preferences.' });
    }
  };

  const handleOverlayOpacity = async (opacity: number) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({ overlay_opacity: opacity, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, overlay_opacity: opacity });
    } catch (error) {
      console.error('Error updating overlay opacity:', error);
      setMessage({ type: 'error', text: 'Failed to update overlay opacity.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;

    setLoading(true);
    setMessage(null);

    try {
      await supabase.from('user_preferences').delete().eq('user_id', user.id);
      await supabase.from('user_favorites').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      await supabase.auth.signOut();

      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Events
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV or Excel file containing event data to bulk import events.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV or Excel files (max 10MB)
                  </p>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Type
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {profile?.role === 'admin' && 'Administrator'}
                    {profile?.role === 'organizer' && 'Organizer'}
                    {profile?.role === 'public' && 'User'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile?.role === 'admin' && 'Full access to all features'}
                    {profile?.role === 'organizer' && 'Can create and manage events'}
                    {profile?.role === 'public' && 'Can view and filter events'}
                  </p>
                </div>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium capitalize">
                  {profile?.role}
                </div>
              </div>

              {profile?.role === 'public' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Upgrade to Organizer</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create and manage your own events, reach more audiences, and grow your presence.
                  </p>
                  <button
                    onClick={handleUpgradeToOrganizer}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Upgrading...' : 'Upgrade to Organizer'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendar Preferences
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Show Past Events</p>
                  <p className="text-sm text-gray-600">Display events that have already occurred</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences?.show_past_events || false}
                    onChange={handleTogglePastEvents}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Sync with External Calendars</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCalendarSync('google')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.calendar_sync_google
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Google Calendar</p>
                      <p className="text-xs text-gray-500">{preferences?.calendar_sync_google ? 'Connected' : 'Click to connect'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCalendarSync('apple')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.calendar_sync_apple
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Apple Calendar</p>
                      <p className="text-xs text-gray-500">{preferences?.calendar_sync_apple ? 'Connected' : 'Click to connect'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCalendarSync('outlook')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.calendar_sync_outlook
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V5.8l-.002.04-.008.04-.008.04q-.004.025-.013.049L22.5 6q-.01.016-.02.033-.01.016-.024.033-.014.017-.03.033l1.1 1.1.03.036.036.048q.012.019.022.04l.018.042.022.058.01.03.01.03.002.01L24 12zm-6-8.95h-9v2.4h.05l.93-.93 6.21 6.2V3.05zm1.54 11.67q.2-.05.33-.15.15-.1.25-.27.1-.16.15-.36.05-.2.05-.45 0-.23-.05-.42-.03-.2-.13-.35-.1-.15-.24-.24-.15-.1-.35-.14v-.02q.24-.05.43-.17.2-.12.34-.3.13-.18.2-.4.07-.24.07-.5 0-.34-.1-.62-.1-.29-.31-.5-.2-.22-.53-.35-.31-.12-.75-.12h-2.64v5.34h2.77q.5 0 .85-.12.35-.12.55-.33.22-.2.32-.48.1-.28.1-.62 0-.35-.1-.6zm-1.84-.87h-.69v-1.23h.6q.3 0 .48.15.17.14.17.45 0 .33-.16.48-.15.15-.4.15zm-.15-2.25h-.54V8.6h.5q.27 0 .41.14.15.14.15.4 0 .25-.13.38-.12.13-.39.13zM12.9 14.74h-.56v1.67h-1.3V11h1.86q.49 0 .88.12.38.13.65.37.27.24.42.59.14.35.14.81 0 .35-.09.65-.1.3-.27.53-.18.24-.43.41-.26.17-.6.26l1.5 2.67h-1.48l-1.22-2.67zm-.56-1.05h.47q.36 0 .54-.18.18-.18.18-.53 0-.34-.17-.52-.18-.19-.55-.19h-.47v1.42zM5.5 15.78v-1.73l.02-1.19.03-.81h-.02l-.36 1.08-1 2.65h-.77l-1.03-2.65-.36-1.08h-.02l.03.81.02 1.19v1.73h-1.2V11h1.63l.87 2.28q.08.2.13.35.05.15.08.27.04.1.06.18l.04.17h.02q.01-.08.04-.17l.06-.18q.03-.12.08-.27.05-.15.13-.35L5.17 11h1.63v4.78H5.5z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Outlook Calendar</p>
                      <p className="text-xs text-gray-500">{preferences?.calendar_sync_outlook ? 'Connected' : 'Click to connect'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCalendarSync('yahoo')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.calendar_sync_yahoo
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Y!</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Yahoo Calendar</p>
                      <p className="text-xs text-gray-500">{preferences?.calendar_sync_yahoo ? 'Connected' : 'Click to connect'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCalendarSync('ical')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all sm:col-span-2 ${
                      preferences?.calendar_sync_ical
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">iCal / Other Calendars</p>
                      <p className="text-xs text-gray-500">{preferences?.calendar_sync_ical ? 'Connected' : 'Click to connect'}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Menu Preferences
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block font-medium text-gray-900 mb-3">
                  Menu Interaction Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleMenuInteractionMode('click')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.menu_interaction_mode === 'click'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MousePointer className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Click</p>
                      <p className="text-xs text-gray-500">Open menus by clicking</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleMenuInteractionMode('hover')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.menu_interaction_mode === 'hover'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Hover</p>
                      <p className="text-xs text-gray-500">Open menus by hovering</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Menu Overlay</p>
                  <p className="text-sm text-gray-600">Dim background when menu is open</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences?.menu_overlay_enabled || false}
                    onChange={handleMenuOverlay}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Maximize2 className="w-5 h-5" />
                Event Display Preferences
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Customize how you view and interact with event details
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block font-medium text-gray-900 mb-3">
                  Event Interaction Mode
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Control how event details are triggered
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleEventInteractionMode('click')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_interaction_mode === 'click'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MousePointer className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Click</p>
                      <p className="text-xs text-gray-500">Open by clicking</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleEventInteractionMode('hover')}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_interaction_mode === 'hover'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Hover</p>
                      <p className="text-xs text-gray-500">Open by hovering</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block font-medium text-gray-900 mb-3">
                  Display Mode
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose how event details are displayed
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEventDisplayMode('popup')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_display_mode === 'popup'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-6 border-2 border-gray-400 rounded"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Popup</p>
                      <p className="text-xs text-gray-500">Centered modal</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleEventDisplayMode('overlay')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_display_mode === 'overlay'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-8 border-2 border-gray-400 rounded"></div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Overlay</p>
                      <p className="text-xs text-gray-500">Full overlay</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleEventDisplayMode('fullpage')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_display_mode === 'fullpage'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Full Page</p>
                      <p className="text-xs text-gray-500">Page transition</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block font-medium text-gray-900 mb-3">
                  Background Style
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose the background treatment for event details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEventBackgroundMode('white')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_background_mode === 'white'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg"></div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">White</p>
                      <p className="text-xs text-gray-500">Clean background</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleEventBackgroundMode('image')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_background_mode === 'image'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Image</p>
                      <p className="text-xs text-gray-500">Event image</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleEventBackgroundMode('blur')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      preferences?.event_background_mode === 'blur'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center opacity-60">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Blur</p>
                      <p className="text-xs text-gray-500">Blurred effect</p>
                    </div>
                  </button>
                </div>
              </div>

              {preferences?.event_display_mode === 'overlay' && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block font-medium text-gray-900 mb-3">
                    Overlay Opacity
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Adjust the opacity of the overlay background
                  </p>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={preferences?.overlay_opacity ?? 50}
                      onChange={(e) => handleOverlayOpacity(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transparent</span>
                      <span className="font-medium text-gray-900">{preferences?.overlay_opacity ?? 50}%</span>
                      <span className="text-gray-500">Opaque</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Event Reminders</p>
                  <p className="text-sm text-gray-600">Get notified about upcoming events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Events in Your Area</p>
                  <p className="text-sm text-gray-600">Stay updated with local events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </h2>
            </div>
            <div className="p-6">
              <button className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Change Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-red-200">
            <div className="p-6 border-b border-red-200 bg-red-50">
              <h2 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. All your data, events, and preferences will be permanently removed.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Are you absolutely sure?</p>
                      <p className="text-sm text-red-600 mt-1">
                        This action cannot be undone. Type <strong>DELETE</strong> to confirm.
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Deleting...' : 'Permanently Delete Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
