import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { Event } from '../../types';
import { downloadICalendar } from '../../utils/calendar';

interface ExportButtonProps {
  event: Event;
  className?: string;
  iconSize?: number;
}

export function ExportButton({ event, className = '', iconSize = 4 }: ExportButtonProps) {
  const [isExported, setIsExported] = useState(false);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICalendar(event);
    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const iconClass = `w-${iconSize} h-${iconSize}`;

  return (
    <button
      onClick={handleExport}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none ${
        isExported
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
      aria-label={isExported ? 'Event added to calendar' : 'Add event to calendar'}
    >
      {isExported ? (
        <>
          <Check className={iconClass} />
          Added!
        </>
      ) : (
        <>
          <Download className={iconClass} />
          Add to Calendar
        </>
      )}
    </button>
  );
}
