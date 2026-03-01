import { useState, useRef, useEffect } from 'react';
import { Event, EventInteractionMode } from '../../types';
import { EventCard } from './EventCard';

interface EventCardWrapperProps {
  event: Event;
  interactionMode: EventInteractionMode;
  onEventClick: (event: Event) => void;
  showDistance?: boolean;
}

export function EventCardWrapper({ event, interactionMode, onEventClick, showDistance }: EventCardWrapperProps) {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (interactionMode === 'click') {
      onEventClick(event);
    }
  };

  const handleMouseEnter = () => {
    if (interactionMode === 'hover') {
      hoverTimeoutRef.current = setTimeout(() => {
        onEventClick(event);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (interactionMode === 'hover' && hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <EventCard
        event={event}
        onClick={handleClick}
        showDistance={showDistance}
      />
    </div>
  );
}
