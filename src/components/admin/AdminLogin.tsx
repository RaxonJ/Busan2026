import { useState } from 'react';
import { LogIn, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onClose?: () => void;
}

export function AdminLogin({ onLogin, onClose }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FAF8F5] rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2C4F7C]/10 mb-4">
            <LogIn className="w-6 h-6 text-[#2C4F7C]" />
          </div>
          <h1 className="font-serif text-2xl text-[#2C2C2C] tracking-wide">管理後台</h1>
          <p className="text-sm text-[#8C8C8C] mt-1">釜山秋遊 2026 · Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-[#2C2C2C] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#2C4F7C]/30 focus:border-[#2C4F7C] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2C2C2C] mb-1.5">
              密碼
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-stone-200 bg-white text-[#2C2C2C] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#2C4F7C]/30 focus:border-[#2C4F7C] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C8C8C] hover:text-[#2C2C2C] transition-colors cursor-pointer"
                aria-label={showPwd ? '隱藏密碼' : '顯示密碼'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 px-4 rounded-lg bg-[#2C4F7C] text-white font-medium hover:bg-[#1e3a5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer mt-2"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="text-center text-xs text-[#8C8C8C] mt-8">
          僅限管理員使用
        </p>
      </div>
    </div>
  );
}
