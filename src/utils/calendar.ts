import { Event } from '../types';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (
    currentDate <= lastDay ||
    currentDate.getDay() !== 0 ||
    dates.length < 35
  ) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function getRollingMonthDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function groupEventsByDate(events: Event[]): Map<string, Event[]> {
  const grouped = new Map<string, Event[]>();

  events.forEach((event) => {
    const dateKey = event.event_date;
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });

  return grouped;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function exportToICalendar(event: Event): string {
  const formatICalDate = (dateStr: string, timeStr: string | null) => {
    const date = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDateTime = formatICalDate(event.event_date, event.event_time);
  const endDateTime = event.end_date
    ? formatICalDate(event.end_date, event.end_time)
    : formatICalDate(event.event_date, event.event_time);

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Entertainment Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@entertainmentcal.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.venue_name || ''}, ${event.address}, ${event.city}, ${event.state}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return ical;
}

export function downloadICalendar(event: Event): void {
  const ical = exportToICalendar(event);
  const blob = new Blob([ical], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
