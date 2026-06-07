import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plane, Train, TrainTrack, Bus, UtensilsCrossed, FileText, Image as ImageIcon } from 'lucide-react';
import { useItinerary } from '../hooks/useItinerary';
import AttachmentModal from './AttachmentModal';
import type { Attachment } from '../types/itinerary';

interface TicketsOverviewProps {
  onBack: () => void;
  initialDay?: number;
}

const ticketTypeConfig = {
  flight: {
    icon: Plane,
    label: '航班',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    iconColor: 'text-sky-600',
  },
  train: {
    icon: Train,
    label: '火車',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  metro: {
    icon: TrainTrack,
    label: '地鐵',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    iconColor: 'text-violet-600',
  },
  bus: {
    icon: Bus,
    label: '巴士',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
  },
  restaurant: {
    icon: UtensilsCrossed,
    label: '餐廳訂位',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconColor: 'text-rose-600',
  },
};

export function TicketsOverview({ onBack, initialDay }: TicketsOverviewProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialDay == null) return;
    const el = dayRefs.current[initialDay];
    if (el) {
      // 等待動畫完成後再滾動，並補償 sticky header 高度
      const timer = setTimeout(() => {
        const stickyHeader = document.querySelector('.sticky.top-0') as HTMLElement | null;
        const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialDay]);
  function handleAttachmentClick(attachment: Attachment) {
    setSelectedAttachment(attachment);
  }

  // 使用 Supabase 資料（含 localStorage 快取 + fallback）
  const [itinerary] = useItinerary();

  // 提取所有有票券的天數
  const daysWithTickets = itinerary
    .filter((day) => day.tickets && day.tickets.length > 0)
    .map((day) => ({
      day: day.day,
      date: day.date,
      title: day.title,
      tickets: day.tickets!,
    }));

  const totalTickets = daysWithTickets.reduce((sum, day) => sum + day.tickets.length, 0);

  return (
    <div className="min-h-screen bg-washi pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-washi/95 backdrop-blur-sm border-b border-washi-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-11 h-11 text-ink hover:text-stone transition-colors rounded-full hover:bg-washi-card"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-ink tracking-wide">
                交通票券
              </h1>
              <p className="text-sm text-stone tracking-wider mt-0.5">
                共 {totalTickets} 張票券
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Days with Tickets */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {daysWithTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone tracking-wider">尚未新增票券資料</p>
          </div>
        ) : (
          daysWithTickets.map((dayData, dayIndex) => (
            <div
              key={dayData.day}
              ref={(el) => { dayRefs.current[dayData.day] = el; }}
              className="animate-fade-in"
              style={{ animationDelay: `${dayIndex * 100}ms` }}
            >
              {/* Day Header */}
              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif text-xl text-ink tracking-wide">
                    Day {dayData.day}
                  </h2>
                  {dayData.date && (
                    <span className="text-sm text-[#8C8C8C] tracking-wider">
                      {dayData.date}
                    </span>
                  )}
                </div>
                <p className="text-stone mt-1">{dayData.title}</p>
              </div>

              {/* Tickets */}
              <div className="space-y-3">
                {dayData.tickets.map((ticket, ticketIndex) => {
                  const config = ticketTypeConfig[ticket.type as keyof typeof ticketTypeConfig] ?? ticketTypeConfig.bus;
                  const Icon = config.icon;

                  return (
                    <div
                      key={ticketIndex}
                      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
                      style={{
                        animation: 'ticketSlideIn 0.5s ease-out forwards',
                        animationDelay: `${(dayIndex * 100) + (ticketIndex * 80)}ms`,
                        opacity: 0,
                      }}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-10 h-10 ${config.iconColor} flex items-center justify-center rounded-full bg-white/60 border ${config.borderColor}`}>
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-ink">
                              {ticket.name}
                            </h3>
                            <span className={`text-xs ${config.iconColor} border ${config.borderColor} rounded-full px-2 py-0.5 bg-white/40`}>
                              {config.label}
                            </span>
                          </div>

                          {ticket.datetime && (
                            <p className="text-sm text-[#8C8C8C] tracking-wider">
                              {ticket.datetime}
                            </p>
                          )}

                          {ticket.notes && (
                            <p className="text-sm text-stone mt-2">
                              {ticket.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attachments */}
                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-200/50">
                          {ticket.attachments.map((attachment, attIndex) => (
                            <button
                              key={attIndex}
                              onClick={() => handleAttachmentClick(attachment)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-white/60 border border-stone-300 rounded-full text-sm text-[#2C2C2C] hover:bg-white transition-all"
                            >
                              {attachment.type === 'pdf' ? (
                                <FileText className="w-4 h-4" strokeWidth={1.5} />
                              ) : (
                                <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                              )}
                              <span>{attachment.label || '附件'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={selectedAttachment !== null}
        onClose={() => setSelectedAttachment(null)}
        attachment={selectedAttachment}
      />


      <style>{`
        @keyframes ticketSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
