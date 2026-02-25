import { Calendar, MapPin, Clock, DollarSign, Download } from 'lucide-react';
import { Event } from '../../types';
import { formatDate, formatTime, downloadICalendar } from '../../utils/calendar';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  showDistance?: boolean;
}

export function EventCard({ event, onClick, showDistance }: EventCardProps) {
  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICalendar(event);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-blue-300"
    >
      {event.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {event.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>

        {event.genres && event.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: genre.color }}
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {formatDate(event.event_date)}
              {event.event_time && ` at ${formatTime(event.event_time)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {event.venue_name && `${event.venue_name}, `}
              {event.city}, {event.state}
            </span>
          </div>

          {showDistance && event.distance !== undefined && (
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{event.distance.toFixed(1)} miles away</span>
            </div>
          )}

          {event.price !== null && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>{event.price === 0 ? 'Free' : `$${event.price}`}</span>
            </div>
          )}

          {event.age_limit && (
            <div className="text-xs text-gray-500 mt-2">
              Age Limit: {event.age_limit}
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Add to Calendar
        </button>
      </div>
    </div>
  );
}
