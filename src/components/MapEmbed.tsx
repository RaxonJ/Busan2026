import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

interface MapEmbedProps {
  mapQuery: string;
  title?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function MapEmbed({ mapQuery, title, isOpen, onToggle }: MapEmbedProps) {
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) setHasOpened(true);
    onToggle();
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium text-ai hover:bg-ai/5 transition-all"
        aria-label={isOpen ? '收合地圖' : '展開地圖'}
        aria-expanded={isOpen}
      >
        <MapPin className="w-4 h-4" />
        <span>查看地圖</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div>
          {hasOpened && (
            <div className="mt-3 rounded-lg overflow-hidden shadow-md">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="200"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
                title={title ? `Map: ${title}` : `Map: ${mapQuery}`}
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
