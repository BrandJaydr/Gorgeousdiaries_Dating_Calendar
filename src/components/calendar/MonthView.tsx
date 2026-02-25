import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '../../types';
import { getMonthDates, groupEventsByDate, isToday, isSameDay } from '../../utils/calendar';

interface MonthViewProps {
  events: Event[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventHover?: (event: Event | null) => void;
}

export function MonthView({ events, currentDate, onDateChange, onEventClick, onEventHover }: MonthViewProps) {
  const monthDates = getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
  const eventsByDate = groupEventsByDate(events);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDates.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isTodayDate = isToday(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isTodayDate ? 'bg-blue-50' : ''}`}
            >
              <div
                className={`text-sm font-semibold mb-1 ${
                  isTodayDate
                    ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                    : isCurrentMonth
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    onMouseEnter={() => onEventHover?.(event)}
                    onMouseLeave={() => onEventHover?.(null)}
                    className="text-xs p-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer truncate transition-colors"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-600 font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
