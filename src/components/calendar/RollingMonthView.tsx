import { useMemo, memo } from 'react';
import { Event } from '../../types';
import { getRollingMonthDates, groupEventsByDate, isToday } from '../../utils/calendar';
import { EventCard } from './EventCard';

interface RollingMonthViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventHover?: (event: Event | null) => void;
}

export const RollingMonthView = memo(function RollingMonthView({ events, onEventClick, onEventHover }: RollingMonthViewProps) {
  const rollingDates = useMemo(() => getRollingMonthDates(new Date()), [
    // Re-calculate if the day changes
    new Date().toDateString()
  ]);
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
        <h2 className="text-xl font-bold">Next 60 Days</h2>
        <p className="text-sm text-blue-100 mt-1">Showing all upcoming events</p>
      </div>

      <div className="p-4 space-y-6 max-h-[800px] overflow-y-auto">
        {rollingDates.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isTodayDate = isToday(date);

          if (dayEvents.length === 0 && index > 7) return null;

          return (
            <div key={index}>
              <div
                className={`sticky top-0 bg-white z-10 pb-2 mb-3 border-b-2 ${
                  isTodayDate ? 'border-blue-600' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-3xl font-bold ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  {isTodayDate && (
                    <span className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      Today
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  )}
                </div>
              </div>

              {dayEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onMouseEnter={() => onEventHover?.(event)}
                      onMouseLeave={() => onEventHover?.(null)}
                    >
                      <EventCard
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                index <= 7 && (
                  <p className="text-sm text-gray-400 py-4">No events scheduled</p>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
