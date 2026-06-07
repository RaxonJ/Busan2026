import { useRef, useState } from 'react';
import { Upload, Loader2, ImageIcon, FileText, X } from 'lucide-react';
import { uploadToStorage } from '../../hooks/useAdminMutations';

interface FileUploadButtonProps {
  folder: 'photos' | 'attachments';
  accept: string;
  onUploaded: (url: string) => void;
  onRemoved?: () => void;
  disabled?: boolean;
  currentUrl?: string;
  label?: string;
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

export function FileUploadButton({
  folder,
  accept,
  onUploaded,
  onRemoved,
  disabled = false,
  currentUrl,
  label = '選擇檔案',
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadToStorage(file, folder);
      onUploaded(url);
    } catch (err) {
      setError('上傳失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setUploading(false);
      // 清除 input 以便重複選同一檔案時也能觸發
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const showImagePreview = currentUrl && isImageUrl(currentUrl);
  const showFileIcon = currentUrl && !isImageUrl(currentUrl);

  return (
    <div className="space-y-2">
      {/* 預覽區 */}
      {showImagePreview && (
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
          <img
            src={currentUrl}
            alt="預覽"
            className="w-full h-full object-cover"
          />
          {onRemoved && (
            <button
              type="button"
              onClick={onRemoved}
              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors cursor-pointer"
              title="移除照片"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {showFileIcon && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200">
          <FileText className="w-4 h-4 text-[#8C8C8C] flex-shrink-0" />
          <span className="text-xs text-[#8C8C8C] truncate flex-1">{currentUrl}</span>
          {onRemoved && (
            <button
              type="button"
              onClick={onRemoved}
              className="p-1 rounded text-[#8C8C8C] hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
              title="移除"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 上傳按鈕 */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-stone-300
          bg-stone-50 hover:bg-stone-100 hover:border-[#2C4F7C] text-sm text-[#8C8C8C]
          hover:text-[#2C4F7C] disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors w-full justify-center cursor-pointer"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            上傳中...
          </>
        ) : currentUrl ? (
          <>
            <ImageIcon className="w-4 h-4" />
            更換{folder === 'photos' ? '照片' : '檔案'}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {label}
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
