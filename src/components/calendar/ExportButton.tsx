import { useState, useEffect, useRef } from 'react';
import { Download, Check } from 'lucide-react';
import { Event } from '../../types';
import { downloadICalendar } from '../../utils/calendar';

interface ExportButtonProps {
  event: Event;
  className?: string;
  iconSize?: number;
}

export function ExportButton({ event, className = '', iconSize = 16 }: ExportButtonProps) {
  const [isExported, setIsExported] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICalendar(event);
    setIsExported(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsExported(false), 2000);
  };

  const Icon = isExported ? Check : Download;

  return (
    <button
      onClick={handleExport}
      className={`${className} flex items-center justify-center gap-2 transition-colors ${
        isExported ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      <Icon size={iconSize} />
      {isExported ? 'Added!' : 'Add to Calendar'}
    </button>
  );
}
