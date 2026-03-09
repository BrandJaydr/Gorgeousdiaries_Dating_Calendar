import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Filter, Search } from 'lucide-react';
import { EventFilters, Genre } from '../../types';
import { US_STATES } from '../../utils/states';
import { getCurrentLocation, geocodeAddress } from '../../utils/geolocation';
import { supabase } from '../../lib/supabase';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  onApplyFilters?: () => void;
}

export function FilterSidebar({ isOpen, onClose, filters, onFiltersChange, onApplyFilters }: FilterSidebarProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    const { data } = await supabase.from('genres').select('*').order('name');
    if (data) setGenres(data);
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    const location = await getCurrentLocation();
    if (location) {
      onFiltersChange({
        ...filters,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: filters.radius || 25,
      });
    }
    setIsLoadingLocation(false);
  };

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return;

    setIsLoadingLocation(true);
    const location = await geocodeAddress(locationInput);
    if (location) {
      onFiltersChange({
        ...filters,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: filters.radius || 25,
      });
    }
    setIsLoadingLocation(false);
  };

  const handleGenreToggle = (genreId: string) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];

    onFiltersChange({ ...filters, genres: newGenres });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setLocationInput('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h2 className="text-xl font-bold">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Location</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <button
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
            >
              {isLoadingLocation ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {isLoadingLocation ? 'Getting location...' : 'Use My Location'}
            </button>

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Enter city, state, or zip"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleLocationSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600"
                aria-label="Search location"
                title="Search location"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            {(filters.latitude || filters.longitude) && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius: {filters.radius || 25} miles
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={filters.radius || 25}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, radius: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 mi</span>
                  <span>200 mi</span>
                </div>
              </div>
            )}

            <select
              value={filters.state || ''}
              onChange={(e) => onFiltersChange({ ...filters, state: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            >
              <option value="">All States</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="City"
              value={filters.city || ''}
              onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />

            <input
              type="text"
              placeholder="Zip Code"
              value={filters.zipCode || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, zipCode: e.target.value || undefined })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Entertainment Type</h3>
            <div className="space-y-2">
              {genres.map((genre) => (
                <label
                  key={genre.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.genres?.includes(genre.id) || false}
                    onChange={() => handleGenreToggle(genre.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="text-sm text-gray-700">{genre.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Date Range</h3>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, startDate: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, endDate: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min price"
                value={filters.minPrice || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Age Restrictions</h3>
            <select
              value={filters.ageLimit || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, ageLimit: e.target.value || undefined })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Ages</option>
              <option value="All Ages">All Ages</option>
              <option value="18+">18+</option>
              <option value="21+">21+</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onApplyFilters?.();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Search className="w-5 h-5" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
