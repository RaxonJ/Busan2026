import { useState } from 'react';
import { ChevronLeft, Hotel, FileText, Image as ImageIcon, ExternalLink, X } from 'lucide-react';
import { useItinerary } from '../hooks/useItinerary';
import { MapEmbed } from './MapEmbed';
import AttachmentModal from './AttachmentModal';
import type { Attachment } from '../types/itinerary';

interface AccommodationOverviewProps {
  onBack: () => void;
}

export function AccommodationOverview({ onBack }: AccommodationOverviewProps) {
  const [openMapIndex, setOpenMapIndex] = useState<number | null>(null);
  const [openLinkIndex, setOpenLinkIndex] = useState<number | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  function handleAttachmentClick(attachment: Attachment) {
    setSelectedAttachment(attachment);
  }

  // 使用 Supabase 資料（含 localStorage 快取 + fallback）
  const [itinerary] = useItinerary();

  // 提取所有有住宿的天數
  const accommodations = itinerary
    .filter((day) => day.accommodation)
    .map((day) => ({
      day: day.day,
      title: day.title,
      accommodation: day.accommodation!,
    }));

  return (
    <div className="min-h-screen bg-washi pb-20">
      {openLinkIndex !== null && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpenLinkIndex(null)}
          aria-hidden="true"
        />
      )}
      {/* 頂部導航 */}
      <div className="sticky top-0 z-50 bg-[#2C4F7C] text-white px-4 py-4 flex items-center gap-3 shadow-md">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="返回行程"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Hotel className="w-6 h-6" />
          住宿總覽
        </h1>
      </div>

      {/* 住宿列表 */}
      <div className="p-4 space-y-4">
        {accommodations.map((item, index) => (
          <div
            key={item.day}
            className="bg-washi-card border border-washi-border rounded-lg shadow-sm p-4"
          >
            {/* Day 標籤 */}
            <div className="inline-block bg-[#2C4F7C] text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
              Day {item.day} · {item.title}
            </div>

            {/* 住宿資訊 */}
            <h3 className="font-bold text-ink text-lg mb-2">
              {item.accommodation.name}
            </h3>

            {item.accommodation.description && (
              <p className="text-stone mb-3">{item.accommodation.description}</p>
            )}

            {/* 附件與連結按鈕 */}
            {((item.accommodation.attachments && item.accommodation.attachments.length > 0) ||
              (item.accommodation.links && item.accommodation.links.length > 0)) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {item.accommodation.attachments && item.accommodation.attachments.map((attachment, attIndex) => (
                  <button
                    key={attIndex}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-stone-300 rounded-full text-sm text-[#2C2C2C] hover:bg-stone-100 transition-colors"
                  >
                    {attachment.type === 'pdf' ? (
                      <FileText className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                    )}
                    <span>{attachment.label || '附件'}</span>
                  </button>
                ))}
                {item.accommodation.links && item.accommodation.links.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenLinkIndex(openLinkIndex === index ? null : index)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-stone-300 rounded-full text-sm text-[#2C4F7C] hover:border-[#2C4F7C] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>參考連結</span>
                    </button>
                    {openLinkIndex === index && (
                      <div className="absolute left-0 top-11 z-50 w-72 bg-[#FAF8F5] border border-washi-border rounded-lg shadow-2xl ring-1 ring-black/5 overflow-hidden animate-popover-in">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-washi-border bg-washi-card/30">
                          <h3 className="text-sm font-serif font-bold text-ink tracking-wide">參考連結</h3>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenLinkIndex(null); }}
                            className="flex items-center justify-center w-6 h-6 text-stone hover:text-ink transition-colors rounded-full hover:bg-washi-card"
                            aria-label="關閉"
                          >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                          {item.accommodation.links.map((link, idx) => (
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
            )}

            {/* 地圖 */}
            {item.accommodation.mapQuery && (
              <MapEmbed
                mapQuery={item.accommodation.mapQuery}
                title={item.accommodation.name}
                isOpen={openMapIndex === index}
                onToggle={() => setOpenMapIndex(openMapIndex === index ? null : index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={selectedAttachment !== null}
        onClose={() => setSelectedAttachment(null)}
        attachment={selectedAttachment}
      />

    </div>
  );
}
