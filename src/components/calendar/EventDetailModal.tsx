import { X, Calendar, MapPin, Clock, DollarSign, Download, Phone, Navigation } from 'lucide-react';
import { Event, EventDisplayMode, EventBackgroundMode } from '../../types';
import { formatDate, formatTime, downloadICalendar } from '../../utils/calendar';

interface EventDetailModalProps {
  event: Event;
  displayMode: EventDisplayMode;
  backgroundMode: EventBackgroundMode;
  overlayOpacity?: number;
  isClickTriggered?: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, displayMode, backgroundMode, overlayOpacity = 50, isClickTriggered = false, onClose }: EventDetailModalProps) {
  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICalendar(event);
  };

  const handleGetDirections = () => {
    const address = `${event.address}, ${event.city}, ${event.state} ${event.zip_code || ''}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (backgroundMode === 'image' && event.image_url) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${event.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (backgroundMode === 'blur' && event.image_url) {
      return {
        backgroundImage: `url(${event.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {};
  };

  const isImageBackground = backgroundMode === 'image' && event.image_url;
  const isBlurBackground = backgroundMode === 'blur' && event.image_url;
  const textColorClass = isImageBackground ? 'text-white' : 'text-gray-900';
  const subTextColorClass = isImageBackground ? 'text-gray-200' : 'text-gray-600';

  if (displayMode === 'popup') {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            {event.image_url && (
              <div className="relative h-64 overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {event.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Featured
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h2>

            {event.genres && event.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {event.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 text-sm rounded-full text-white font-medium"
                    style={{ backgroundColor: genre.color }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {event.description && (
              <p className="text-gray-700 mb-6 leading-relaxed">{event.description}</p>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {formatDate(event.event_date)}
                  </div>
                  {event.event_time && (
                    <div className="text-gray-600">{formatTime(event.event_time)}</div>
                  )}
                  {event.end_date && (
                    <div className="text-gray-600 text-sm mt-1">
                      Ends: {formatDate(event.end_date)}
                      {event.end_time && ` at ${formatTime(event.end_time)}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  {event.venue_name && (
                    <div className="font-semibold text-gray-900">{event.venue_name}</div>
                  )}
                  <div className="text-gray-600">
                    {event.address}<br />
                    {event.city}, {event.state} {event.zip_code}
                  </div>
                  {event.distance !== undefined && (
                    <div className="text-blue-600 font-medium text-sm mt-1">
                      {event.distance.toFixed(1)} miles away
                    </div>
                  )}
                </div>
              </div>

              {event.price !== null && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900 font-semibold">
                    {event.price === 0 ? 'Free Entry' : `$${event.price}`}
                  </span>
                </div>
              )}

              {event.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <a href={`tel:${event.phone_number}`} className="text-blue-600 hover:underline">
                    {event.phone_number}
                  </a>
                </div>
              )}

              {event.age_limit && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900">Age Limit: {event.age_limit}</span>
                </div>
              )}

              {event.dress_code && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-600">Dress Code: </span>
                  <span className="text-sm text-gray-900 font-medium">{event.dress_code}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                Add to Calendar
              </button>
              <button
                onClick={handleGetDirections}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayMode === 'overlay') {
    const overlayBgColor = `rgba(0, 0, 0, ${overlayOpacity / 100})`;

    return (
      <div
        className={`fixed inset-0 z-50 overflow-hidden ${isBlurBackground ? 'animate-in' : ''}`}
        style={{
          ...getBackgroundStyle(),
          backgroundColor: backgroundMode === 'white' ? overlayBgColor : undefined,
          backdropFilter: isBlurBackground ? 'blur(20px)' : undefined,
          transition: isBlurBackground ? 'backdrop-filter 600ms ease-in-out' : undefined,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: backgroundMode === 'white' ? undefined : overlayBgColor,
          }}
        >
          <div
            className={`w-full max-w-4xl h-full max-h-[95vh] overflow-y-auto rounded-lg ${
              backgroundMode === 'white' ? 'bg-white' : 'bg-white/95 backdrop-blur-sm'
            }`}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${textColorClass}`}>{event.title}</h2>
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>

            <div className="p-6">
              {event.image_url && (
                <div className="relative h-96 overflow-hidden rounded-lg mb-6">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {event.featured && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Featured
                    </div>
                  )}
                </div>
              )}

              {event.genres && event.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-sm rounded-full text-white font-medium"
                      style={{ backgroundColor: genre.color }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {event.description && (
                <p className="text-gray-700 mb-8 leading-relaxed text-lg">{event.description}</p>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {formatDate(event.event_date)}
                      </div>
                      {event.event_time && (
                        <div className="text-gray-600">{formatTime(event.event_time)}</div>
                      )}
                      {event.end_date && (
                        <div className="text-gray-600 text-sm mt-1">
                          Ends: {formatDate(event.end_date)}
                          {event.end_time && ` at ${formatTime(event.end_time)}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      {event.venue_name && (
                        <div className="font-semibold text-gray-900 text-lg">{event.venue_name}</div>
                      )}
                      <div className="text-gray-600">
                        {event.address}<br />
                        {event.city}, {event.state} {event.zip_code}
                      </div>
                      {event.distance !== undefined && (
                        <div className="text-blue-600 font-medium text-sm mt-1">
                          {event.distance.toFixed(1)} miles away
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {event.price !== null && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-900 font-semibold text-lg">
                        {event.price === 0 ? 'Free Entry' : `$${event.price}`}
                      </span>
                    </div>
                  )}

                  {event.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <a href={`tel:${event.phone_number}`} className="text-blue-600 hover:underline text-lg">
                        {event.phone_number}
                      </a>
                    </div>
                  )}

                  {event.age_limit && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-900 text-lg">Age Limit: {event.age_limit}</span>
                    </div>
                  )}

                  {event.dress_code && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600">Dress Code: </span>
                      <span className="text-gray-900 font-medium">{event.dress_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  <Download className="w-6 h-6" />
                  Add to Calendar
                </button>
                <button
                  onClick={handleGetDirections}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  <Navigation className="w-6 h-6" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${isBlurBackground ? '' : 'animate-in fade-in duration-300'}`}
      style={{
        ...getBackgroundStyle(),
        backdropFilter: isBlurBackground ? 'blur(20px)' : undefined,
        transition: isBlurBackground ? 'backdrop-filter 600ms ease-in-out' : undefined,
      }}
    >
      <div className="min-h-screen p-4" style={{ paddingTop: '20%' }}>
        <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
          <button
            onClick={onClose}
            className="mb-4 flex items-center gap-2 bg-white/90 hover:bg-white rounded-full px-4 py-2 transition-colors font-medium"
            aria-label="Go back"
          >
            <X className="w-5 h-5" />
            Back to Calendar
          </button>

          <div className={`rounded-lg overflow-hidden ${
            backgroundMode === 'white' ? 'bg-white' : 'bg-white/95 backdrop-blur-sm'
          }`}>
            {event.image_url && (
              <div className="relative h-[60vh] overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {event.featured && (
                  <div className="absolute top-6 right-6 bg-yellow-500 text-white px-6 py-3 rounded-full text-lg font-semibold">
                    Featured Event
                  </div>
                )}
              </div>
            )}

            <div className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{event.title}</h1>

              {event.genres && event.genres.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {event.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-4 py-2 text-base rounded-full text-white font-medium"
                      style={{ backgroundColor: genre.color }}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {event.description && (
                <p className="text-gray-700 mb-10 leading-relaxed text-xl">{event.description}</p>
              )}

              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-7 h-7 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-gray-900 text-xl">
                        {formatDate(event.event_date)}
                      </div>
                      {event.event_time && (
                        <div className="text-gray-600 text-lg">{formatTime(event.event_time)}</div>
                      )}
                      {event.end_date && (
                        <div className="text-gray-600 mt-2">
                          Ends: {formatDate(event.end_date)}
                          {event.end_time && ` at ${formatTime(event.end_time)}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="w-7 h-7 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      {event.venue_name && (
                        <div className="font-semibold text-gray-900 text-xl mb-1">{event.venue_name}</div>
                      )}
                      <div className="text-gray-600 text-lg">
                        {event.address}<br />
                        {event.city}, {event.state} {event.zip_code}
                      </div>
                      {event.distance !== undefined && (
                        <div className="text-blue-600 font-medium mt-2">
                          {event.distance.toFixed(1)} miles away
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {event.price !== null && (
                    <div className="flex items-center gap-4">
                      <DollarSign className="w-7 h-7 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-900 font-semibold text-xl">
                        {event.price === 0 ? 'Free Entry' : `$${event.price}`}
                      </span>
                    </div>
                  )}

                  {event.phone_number && (
                    <div className="flex items-center gap-4">
                      <Phone className="w-7 h-7 text-blue-600 flex-shrink-0" />
                      <a href={`tel:${event.phone_number}`} className="text-blue-600 hover:underline text-xl">
                        {event.phone_number}
                      </a>
                    </div>
                  )}

                  {event.age_limit && (
                    <div className="flex items-center gap-4">
                      <Clock className="w-7 h-7 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-900 text-xl">Age Limit: {event.age_limit}</span>
                    </div>
                  )}

                  {event.dress_code && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-lg">Dress Code: </span>
                      <span className="text-gray-900 font-medium text-lg">{event.dress_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xl"
                >
                  <Download className="w-7 h-7" />
                  Add to Calendar
                </button>
                <button
                  onClick={handleGetDirections}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-xl"
                >
                  <Navigation className="w-7 h-7" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
