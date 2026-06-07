import { useState, useEffect } from 'react';
import { Image as ImageIcon, ChevronDown } from 'lucide-react';

interface PhotoViewerProps {
  photoUrl: string;
  alt: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function PhotoViewer({ photoUrl, alt, isOpen, onToggle }: PhotoViewerProps) {
  const [hasOpened, setHasOpened] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // 按 ESC 關閉
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  const handleToggle = () => {
    if (!isOpen) setHasOpened(true);
    onToggle();
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium text-vermillion hover:bg-vermillion/5 transition-all"
        aria-label={isOpen ? '收合照片' : '展開照片'}
        aria-expanded={isOpen}
      >
        <ImageIcon className="w-4 h-4" />
        <span>查看照片</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div>
          {hasOpened && (
            <div className="mt-3 rounded-lg overflow-hidden shadow-md relative">
              {/* 載入中 */}
              {!imageLoaded && !imageError && (
                <div className="w-full h-64 bg-washi-border flex items-center justify-center">
                  <span className="text-stone text-sm font-medium">
                    載入中...
                  </span>
                </div>
              )}
              {/* 載入失敗 */}
              {imageError && (
                <div className="w-full h-32 bg-washi-border flex items-center justify-center">
                  <span className="text-stone text-sm">圖片無法顯示</span>
                </div>
              )}
              <img
                src={photoUrl}
                alt={alt}
                className={`w-full h-auto transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => { setImageError(true); setImageLoaded(true); }}
              />
              {imageLoaded && !imageError && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-lg text-xs text-white whitespace-nowrap">
                  按 ESC 關閉
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
