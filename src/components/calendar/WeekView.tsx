import { useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '../../types';
import { getWeekDates, groupEventsByDate, isToday } from '../../utils/calendar';
import { EventCard } from './EventCard';

interface WeekViewProps {
  events: Event[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventHover?: (event: Event | null) => void;
}

export const WeekView = memo(function WeekView({ events, currentDate, onDateChange, onEventClick, onEventHover }: WeekViewProps) {
  const weekDates = useMemo(() =>
    getWeekDates(currentDate),
    [currentDate]
  );

  const eventsByDate = useMemo(() =>
    groupEventsByDate(events),
    [events]
  );

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDates.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`border-r border-gray-200 last:border-r-0 ${
                isTodayDate ? 'bg-blue-50' : ''
              }`}
            >
              <div
                className={`p-3 text-center border-b border-gray-200 ${
                  isTodayDate ? 'bg-blue-600 text-white' : 'bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-bold mt-1 ${isTodayDate ? 'text-white' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
              </div>
              <div className="p-2 min-h-[400px] overflow-y-auto space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
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
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center mt-8">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
