import { useState } from 'react';
import { Hotel, ExternalLink, X } from 'lucide-react';
import type { Accommodation } from '../types/itinerary';
import { MapEmbed } from './MapEmbed';
import { PhotoViewer } from './PhotoViewer';

interface AccommodationCardProps {
  accommodation: Accommodation;
  photoOpen?: boolean;
  onTogglePhoto?: () => void;
}

export function AccommodationCard({
  accommodation,
  photoOpen = false,
  onTogglePhoto,
}: AccommodationCardProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const hasLinks = accommodation.links && accommodation.links.length > 0;
  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg shadow-sm p-4 mb-2">
      {linksOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setLinksOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex items-start gap-3 mb-2">
        <Hotel className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-ink text-lg">🏨 今晚住宿</h3>
            {hasLinks && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setLinksOpen(prev => !prev)}
                  className="flex items-center justify-center w-10 h-10 text-[#8B6F47] hover:text-[#6B5437] transition-colors rounded-full hover:bg-washi"
                  aria-label={linksOpen ? '關閉參考連結' : '查看參考連結'}
                  aria-expanded={linksOpen}
                >
                  <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
                </button>
                {linksOpen && (
                  <div className="absolute right-0 top-9 z-50 w-72 bg-[#FAF8F5] border border-washi-border rounded-lg shadow-2xl ring-1 ring-black/5 overflow-hidden animate-popover-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-washi-border bg-washi-card/30">
                      <h3 className="text-sm font-serif font-bold text-ink tracking-wide">參考連結</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLinksOpen(false); }}
                        className="flex items-center justify-center w-9 h-9 text-stone hover:text-ink transition-colors rounded-full hover:bg-washi-card"
                        aria-label="關閉"
                      >
                        <X className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                      {accommodation.links!.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-start gap-2 p-3 rounded-lg hover:bg-washi-card transition-all duration-200 group/link"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-stone group-hover/link:text-[#8B6F47] transition-colors flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span className="text-sm text-ink group-hover/link:text-[#8B6F47] transition-colors leading-relaxed">{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-ink font-medium">
            {accommodation.name}
          </p>
          {accommodation.description && (
            <p className="text-sm text-stone mt-1">
              {accommodation.description}
            </p>
          )}
          {accommodation.mapQuery && (
            <div className="mt-2">
              <MapEmbed
                mapQuery={accommodation.mapQuery}
                title={accommodation.name}
                isOpen={isMapOpen}
                onToggle={() => setIsMapOpen(!isMapOpen)}
              />
            </div>
          )}
          {accommodation.photoUrl && onTogglePhoto && (
            <PhotoViewer
              photoUrl={accommodation.photoUrl}
              alt={accommodation.name}
              isOpen={photoOpen}
              onToggle={onTogglePhoto}
            />
          )}
        </div>
      </div>
    </div>
  );
}
