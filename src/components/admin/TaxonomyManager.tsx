import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Tag, Layers } from 'lucide-react';
import { EventCategory, Tag as TagType, EventSeries } from '../../types';
import { supabase } from '../../lib/supabase';

type TaxonomyTab = 'categories' | 'tags' | 'series';

export function TaxonomyManager() {
  const [activeTab, setActiveTab] = useState<TaxonomyTab>('categories');
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [seriesList, setSeriesList] = useState<EventSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('');

  // Tag form
  const [newTagName, setNewTagName] = useState('');
  const [newTagDomain, setNewTagDomain] = useState('technology');

  // Series form
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesFrequency, setNewSeriesFrequency] = useState<EventSeries['frequency']>('annual');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [newSeriesWebsite, setNewSeriesWebsite] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [catRes, tagRes, seriesRes] = await Promise.all([
      supabase.from('event_categories').select('*').order('sort_order'),
      supabase.from('tags').select('*').order('name'),
      supabase.from('event_series').select('*').order('name'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (tagRes.data) setTags(tagRes.data);
    if (seriesRes.data) setSeriesList(seriesRes.data as EventSeries[]);
    setLoading(false);
  };

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setError(null);
    const { error } = await supabase.from('event_categories').insert({
      name: newCatName.trim(),
      slug: slugify(newCatName),
      color: newCatColor,
      icon_name: newCatIcon || null,
      sort_order: categories.length + 1,
    });
    if (error) { setError(error.message); return; }
    setNewCatName('');
    setNewCatIcon('');
    fetchAll();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Events using it will lose their category assignment.')) return;
    await supabase.from('event_categories').delete().eq('id', id);
    fetchAll();
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setError(null);
    const { error } = await supabase.from('tags').insert({
      name: newTagName.trim(),
      slug: slugify(newTagName),
      domain: newTagDomain,
    });
    if (error) { setError(error.message); return; }
    setNewTagName('');
    fetchAll();
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag? It will be removed from all events.')) return;
    await supabase.from('tags').delete().eq('id', id);
    fetchAll();
  };

  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) return;
    setError(null);
    const { error } = await supabase.from('event_series').insert({
      name: newSeriesName.trim(),
      slug: slugify(newSeriesName),
      frequency: newSeriesFrequency,
      description: newSeriesDesc || null,
      website: newSeriesWebsite || null,
    });
    if (error) { setError(error.message); return; }
    setNewSeriesName('');
    setNewSeriesDesc('');
    setNewSeriesWebsite('');
    fetchAll();
  };

  const handleDeleteSeries = async (id: string) => {
    if (!confirm('Delete this series? Events linked to it will become standalone.')) return;
    await supabase.from('event_series').delete().eq('id', id);
    fetchAll();
  };

  const domains = ['technology', 'lifestyle', 'entertainment', 'business', 'science', 'social'];

  const tagsByDomain = tags.reduce<Record<string, TagType[]>>((acc, tag) => {
    if (!acc[tag.domain]) acc[tag.domain] = [];
    acc[tag.domain].push(tag);
    return acc;
  }, {});

  const subtabs: { key: TaxonomyTab; label: string; icon: React.ReactNode }[] = [
    { key: 'categories', label: 'Event Types', icon: <Layers className="w-4 h-4" /> },
    { key: 'tags', label: 'Topic Tags', icon: <Tag className="w-4 h-4" /> },
    { key: 'series', label: 'Event Series', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Taxonomy Manager</h2>
      <p className="text-sm text-gray-600 mb-6">
        Manage the controlled vocabulary used for categorizing events. Changes affect filters, event forms, and CSV imports.
      </p>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        {subtabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Event Types / Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCategory} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g., Convention"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
            ) : categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{cat.slug}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Tags */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          <form onSubmit={handleAddTag} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Cybersecurity"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
              <select
                value={newTagDomain}
                onChange={(e) => setNewTagDomain(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {domains.map((d) => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          {loading ? (
            <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
          ) : (
            Object.entries(tagsByDomain).map(([domain, domainTags]) => (
              <div key={domain}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">{domain}</h4>
                <div className="space-y-2">
                  {domainTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{tag.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{tag.slug}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Series */}
      {activeTab === 'series' && (
        <div className="space-y-6">
          <form onSubmit={handleAddSeries} className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Series Name *</label>
                <input
                  type="text"
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  placeholder="e.g., DEF CON"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                <select
                  value={newSeriesFrequency}
                  onChange={(e) => setNewSeriesFrequency(e.target.value as EventSeries['frequency'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="annual">Annual</option>
                  <option value="biannual">Biannual</option>
                  <option value="monthly">Monthly</option>
                  <option value="irregular">Irregular</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                <input
                  type="url"
                  value={newSeriesWebsite}
                  onChange={(e) => setNewSeriesWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Series
            </button>
          </form>

          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
            ) : seriesList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No series yet. Add one above.</p>
            ) : seriesList.map((s) => (
              <div key={s.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{s.name}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs capitalize">{s.frequency}</span>
                  </div>
                  {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      {s.website}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteSeries(s.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  aria-label="Delete series"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
