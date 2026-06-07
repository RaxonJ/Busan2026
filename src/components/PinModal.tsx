import { useState, useEffect, useCallback } from 'react';
import { X, Delete } from 'lucide-react';

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  verify: (pin: string) => Promise<boolean>;
}

export default function PinModal({ onSuccess, onCancel, verify }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyPress = useCallback(async (digit: string) => {
    if (isVerifying || isShaking) return;

    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      setIsVerifying(true);
      try {
        const correct = await verify(newPin);
        if (correct) {
          onSuccess();
          setPin('');
        } else {
          setIsShaking(true);
          setErrorMsg('密碼錯誤，請再試一次');
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 600);
        }
      } catch {
        setErrorMsg('驗證失敗，請重試');
        setPin('');
      } finally {
        setIsVerifying(false);
      }
    }
  }, [pin, isVerifying, isShaking, verify, onSuccess]);

  const handleDelete = useCallback(() => {
    if (isVerifying || isShaking) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  }, [isVerifying, isShaking]);

  // 鍵盤支援
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete, onCancel]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(44, 44, 44, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-xs bg-[#FAF8F5] rounded-2xl border border-stone-200 shadow-lg p-6 transition-transform duration-300 ${
          isShaking ? 'animate-pin-shake' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 text-[#8C8C8C] hover:text-[#2C2C2C] rounded-full hover:bg-stone-100 transition-colors"
          aria-label="取消"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* 標題 */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-xl text-[#2C2C2C] tracking-wide mb-1">
            請輸入密碼
          </h2>
          <p className="text-sm text-[#8C8C8C] tracking-wider">
            查看附件需要驗證身份
          </p>
        </div>

        {/* 圓點指示器 */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? 'bg-[#2C4F7C] border-[#2C4F7C]'
                  : 'bg-transparent border-stone-400'
              }`}
            />
          ))}
        </div>

        {/* 錯誤訊息 */}
        <div className="h-5 text-center mb-4">
          {errorMsg && (
            <p className="text-sm text-red-600 tracking-wider">{errorMsg}</p>
          )}
        </div>

        {/* 數字鍵盤 */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((digit, index) => {
            if (digit === '') {
              return <div key={index} />;
            }
            if (digit === 'del') {
              return (
                <button
                  key={index}
                  onClick={handleDelete}
                  disabled={pin.length === 0 || isVerifying}
                  className="flex items-center justify-center w-full h-16 rounded-full border border-stone-300 text-[#2C2C2C] hover:bg-stone-100 active:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 select-none"
                  aria-label="退格"
                >
                  <Delete className="w-5 h-5" strokeWidth={1.5} />
                </button>
              );
            }
            return (
              <button
                key={index}
                onClick={() => handleKeyPress(digit)}
                disabled={pin.length >= 4 || isVerifying}
                className="flex items-center justify-center w-full h-16 rounded-full border border-stone-200 text-[#2C2C2C] text-xl font-light hover:bg-stone-100 active:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 select-none"
              >
                {digit}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-pin-shake {
          animation: pin-shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
