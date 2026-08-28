import React from 'react';
import { 
  Compass, 
  Flame, 
  Download, 
  Plus, 
  ShieldCheck,
  Crown,
  LayoutList,
  GitGraph
} from 'lucide-react';

interface MobileBottomBarProps {
  isAdmin?: boolean;
  viewMode?: 'tree' | 'list';
  onToggleViewMode?: (mode: 'tree' | 'list') => void;
  onOpenKinship: () => void;
  onOpenAnniversaries: () => void;
  onOpenBackup: () => void;
  onAddMember: () => void;
  onOpenAuth: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  isAdmin = false,
  viewMode = 'tree',
  onToggleViewMode,
  onOpenKinship,
  onOpenAnniversaries,
  onOpenBackup,
  onAddMember,
  onOpenAuth,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-safe select-none">
      {/* View Mode Toggle Button */}
      {onToggleViewMode && (
        <button
          type="button"
          id="btn-mobile-viewmode"
          onClick={() => onToggleViewMode(viewMode === 'tree' ? 'list' : 'tree')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all active:scale-95 ${
            viewMode === 'list' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Chuyển chế độ xem: Cây phả hệ / Danh sách đời"
        >
          <div className="p-1 rounded-xl">
            {viewMode === 'tree' ? (
              <LayoutList className="w-5 h-5 text-amber-400" />
            ) : (
              <GitGraph className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">
            {viewMode === 'tree' ? 'Danh Sách' : 'Cây Phả Hệ'}
          </span>
        </button>
      )}

      {/* Kinship */}
      <button
        type="button"
        id="btn-mobile-kinship"
        onClick={onOpenKinship}
        className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-400 hover:text-amber-300 active:scale-95 transition-all"
        title="Tra cứu xưng hô"
      >
        <div className="p-1 rounded-xl text-amber-400">
          <Compass className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium tracking-tight">Xưng Hô</span>
      </button>

      {/* Center Action Button: Quick Add (Only if Admin) or Quick Admin Login */}
      {isAdmin ? (
        <button
          type="button"
          id="btn-mobile-add"
          onClick={onAddMember}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-900/60 border-2 border-slate-950 active:scale-90 transition-transform font-bold"
          title="Thêm thành viên mới"
        >
          <Plus className="w-6 h-6 stroke-[2.8]" />
        </button>
      ) : (
        <button
          type="button"
          id="btn-mobile-login-prompt"
          onClick={onOpenAuth}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-900/60 border-2 border-slate-950 active:scale-90 transition-transform font-bold"
          title="Đăng nhập tài khoản Quản trị"
        >
          <Crown className="w-5 h-5 fill-slate-950" />
        </button>
      )}

      {/* Anniversaries */}
      <button
        type="button"
        id="btn-mobile-anniversaries"
        onClick={onOpenAnniversaries}
        className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-400 hover:text-amber-300 active:scale-95 transition-all"
        title="Lịch ngày giỗ"
      >
        <div className="p-1 rounded-xl text-amber-400">
          <Flame className="w-5 h-5 fill-amber-400/30" />
        </div>
        <span className="text-[10px] font-medium tracking-tight">Ngày Giỗ</span>
      </button>

      {/* Backup */}
      <button
        type="button"
        id="btn-mobile-backup"
        onClick={onOpenBackup}
        className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
        title="Sao lưu Excel"
      >
        <div className="p-1 rounded-xl text-emerald-400">
          <Download className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium tracking-tight">Excel</span>
      </button>
    </nav>
  );
};

