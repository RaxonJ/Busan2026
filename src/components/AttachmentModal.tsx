import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import type { Attachment } from '../types/itinerary';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment | null;
}

export default function AttachmentModal({ isOpen, onClose, attachment }: AttachmentModalProps) {
  const [scale, setScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset scale when modal opens/closes or attachment changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, attachment]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !attachment) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ease-out ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
      style={{
        backgroundColor: 'rgba(250, 248, 245, 0.95)', // 和紙色半透明
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Modal Container */}
      <div
        className={`relative flex flex-col w-full h-full max-w-6xl max-h-full bg-[#FAF8F5] rounded-lg border border-stone-300 shadow-lg transition-all duration-500 ease-out ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          {attachment.label && (
            <h3 className="font-serif text-lg text-[#2C2C2C] tracking-wide">
              {attachment.label}
            </h3>
          )}
          <div className="ml-auto flex items-center gap-2">
            {/* 在新視窗開啟（PDF 在行動裝置 iframe 可能無法顯示） */}
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#2C4F7C] border border-[#2C4F7C]/30 rounded-full hover:bg-[#2C4F7C]/5 transition-colors duration-200"
              aria-label="在新視窗開啟"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">新視窗開啟</span>
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 text-[#2C2C2C] hover:text-[#8C8C8C] transition-colors duration-300 rounded-full hover:bg-stone-100"
              aria-label="關閉"
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            {attachment.type === 'image' ? (
              <img
                src={attachment.url}
                alt={attachment.label || '附件圖片'}
                className="max-w-full h-auto rounded border border-stone-200 shadow-sm"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <iframe
                  src={attachment.url}
                  className="w-full rounded border border-stone-200 shadow-sm"
                  style={{
                    width: 'calc(100vw - 4rem)',
                    maxWidth: '900px',
                    height: 'calc(100vh - 280px)',
                    minHeight: '300px',
                  }}
                  title={attachment.label || 'PDF 附件'}
                />
                {/* 行動裝置 iframe PDF 可能無法顯示，提供直接開啟連結 */}
                <p className="text-xs text-[#8C8C8C] text-center">
                  若上方無法顯示，請點擊頂部「新視窗開啟」按鈕
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-3 p-4 border-t border-stone-200">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="flex items-center justify-center w-11 h-11 text-[#2C2C2C] border border-stone-300 rounded-full hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
            aria-label="縮小"
          >
            <ZoomOut className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <span className="font-sans text-sm text-[#8C8C8C] tracking-wider min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="flex items-center justify-center w-11 h-11 text-[#2C2C2C] border border-stone-300 rounded-full hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
            aria-label="放大"
          >
            <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
