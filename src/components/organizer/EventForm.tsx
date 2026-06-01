import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event, Genre, EventCategory, Tag, EventSeries } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { US_STATES } from '../../utils/states';
import { geocodeAddress } from '../../utils/geolocation';

interface EventFormProps {
  event: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventForm({ event, onClose, onSuccess }: EventFormProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [genres, setGenres] = useState<Genre[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [seriesList, setSeriesList] = useState<EventSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizers, setOrganizers] = useState<{ id: string; full_name: string | null; email: string }[]>([]);

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '',
    venue_name: event?.venue_name || '',
    address: event?.address || '',
    city: event?.city || '',
    state: event?.state || '',
    zip_code: event?.zip_code || '',
    price: event?.price?.toString() || '',
    dress_code: event?.dress_code || '',
    age_limit: event?.age_limit || '',
    phone_number: event?.phone_number || '',
    image_url: event?.image_url || '',
    selected_genres: event?.genres?.map((g) => g.id) || [],
    selected_tags: event?.tags?.map((t) => t.id) || [],
    category_id: event?.category_id || '',
    series_id: event?.series_id || '',
    organizer_id: event?.organizer_id || (isAdmin ? '' : user?.id || ''),
    status: event?.status || 'pending',
    featured: event?.featured || false,
    verified: event?.verified || false,
  });

  useEffect(() => {
    fetchGenres();
    fetchCategories();
    fetchTags();
    fetchSeries();
    if (isAdmin) {
      fetchOrganizers();
    }
  }, [isAdmin]);

  const fetchGenres = async () => {
    const { data } = await supabase.from('genres').select('*').order('name');
    if (data) setGenres(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('event_categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setTags(data);
  };

  const fetchSeries = async () => {
    const { data } = await supabase.from('event_series').select('id, name, frequency').order('name');
    if (data) setSeriesList(data as EventSeries[]);
  };

  const fetchOrganizers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('role', ['organizer', 'admin'])
      .order('full_name');
    if (data) setOrganizers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const address = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip_code}`;
      const coordinates = await geocodeAddress(address);

      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        venue_name: formData.venue_name || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code || null,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
        price: formData.price ? parseFloat(formData.price) : null,
        dress_code: formData.dress_code || null,
        age_limit: formData.age_limit || null,
        phone_number: formData.phone_number || null,
        image_url: formData.image_url || null,
        organizer_id: isAdmin && formData.organizer_id ? formData.organizer_id : user.id,
        category_id: formData.category_id || null,
        series_id: formData.series_id || null,
        status: isAdmin ? formData.status as Event['status'] : 'pending' as const,
        featured: isAdmin ? formData.featured : false,
        verified: isAdmin ? formData.verified : false,
      };

      let eventId = event?.id;

      if (event) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);
        if (updateError) throw updateError;
      } else {
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();
        if (insertError) throw insertError;
        eventId = newEvent.id;
      }

      if (eventId) {
        // Sync genres
        await supabase.from('event_genres').delete().eq('event_id', eventId);
        if (formData.selected_genres.length > 0) {
          await supabase.from('event_genres').insert(
            formData.selected_genres.map((genreId) => ({ event_id: eventId, genre_id: genreId }))
          );
        }

        // Sync tags
        await supabase.from('event_tags').delete().eq('event_id', eventId);
        if (formData.selected_tags.length > 0) {
          await supabase.from('event_tags').insert(
            formData.selected_tags.map((tagId) => ({ event_id: eventId, tag_id: tagId }))
          );
        }
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_genres: prev.selected_genres.includes(genreId)
        ? prev.selected_genres.filter((id) => id !== genreId)
        : [...prev.selected_genres, genreId],
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_tags: prev.selected_tags.includes(tagId)
        ? prev.selected_tags.filter((id) => id !== tagId)
        : [...prev.selected_tags, tagId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for free events"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Limit</label>
              <select
                value={formData.age_limit}
                onChange={(e) => setFormData({ ...formData, age_limit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Age Limit</option>
                <option value="All Ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dress Code</label>
              <input
                type="text"
                value={formData.dress_code}
                onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Casual, Business Casual, Formal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Event Category */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Event Series */}
            {seriesList.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Series</label>
                <select
                  value={formData.series_id}
                  onChange={(e) => setFormData({ ...formData, series_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Standalone event</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.frequency})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Genres */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Entertainment Genres</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {genres.map((genre) => (
                  <label
                    key={genre.id}
                    className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      borderColor: formData.selected_genres.includes(genre.id)
                        ? genre.color
                        : '#e5e7eb',
                      backgroundColor: formData.selected_genres.includes(genre.id)
                        ? genre.color + '10'
                        : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_genres.includes(genre.id)}
                      onChange={() => handleGenreToggle(genre.id)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">{genre.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">Topic Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = formData.selected_tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin-only controls */}
            {isAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                  <select
                    value={formData.organizer_id}
                    onChange={(e) => setFormData({ ...formData, organizer_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Organizer</option>
                    {organizers.map((organizer) => (
                      <option key={organizer.id} value={organizer.id}>
                        {organizer.full_name || organizer.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Event['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured event</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.verified}
                      onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Verified</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
