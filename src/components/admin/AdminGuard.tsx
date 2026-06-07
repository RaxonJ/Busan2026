import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminLogin } from './AdminLogin';

interface AdminGuardProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function AdminGuard({ children, onClose }: AdminGuardProps) {
  const { user, loading, signIn } = useAdminAuth();

  if (loading) {
    return (
      <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2C4F7C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={signIn} onClose={onClose} />;
  }

  return <>{children}</>;
}
