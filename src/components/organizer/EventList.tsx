import { Edit2, Trash2, Calendar, MapPin } from 'lucide-react';
import { Event } from '../../types';
import { formatDate, formatTime } from '../../utils/calendar';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
        <p className="text-gray-600">Create your first event to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
        >
          <div className="flex">
            {event.image_url && (
              <div className="w-48 h-48 flex-shrink-0">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    {event.featured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Featured
                      </span>
                    )}
                  </div>
                  {event.genres && event.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(event.event_date)}
                    {event.event_time && ` at ${formatTime(event.event_time)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {event.city}, {event.state}
                  </span>
                </div>
              </div>

              {event.description && (
                <p className="mt-3 text-gray-700 line-clamp-2">{event.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
