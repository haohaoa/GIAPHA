import React, { useState, useEffect } from 'react';
import { FamilyTree, AuthUser, Person } from '../types/family';
import { 
  Users, 
  Compass, 
  Flame, 
  Download, 
  Plus, 
  Layers, 
  LogIn, 
  TreeDeciduous,
  LayoutList,
  GitGraph,
  Maximize2,
  Minimize2,
  Crown,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  tree: FamilyTree;
  user: AuthUser | null;
  isAdmin?: boolean;
  viewMode: 'tree' | 'list';
  onToggleViewMode: (mode: 'tree' | 'list') => void;
  onOpenKinship: () => void;
  onOpenAnniversaries: () => void;
  onOpenBackup: () => void;
  onOpenAuth: () => void;
  onAddRootAncestor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tree,
  user,
  isAdmin = false,
  viewMode,
  onToggleViewMode,
  onOpenKinship,
  onOpenAnniversaries,
  onOpenBackup,
  onOpenAuth,
  onAddRootAncestor,
}) => {
  const memberCount = Object.keys(tree.members).length;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };
  
  // Calculate generations count
  const generationsCount = React.useMemo(() => {
    const gens = new Set((Object.values(tree.members) as Person[]).map((m) => m.generation || 1));
    return gens.size || 1;
  }, [tree.members]);

  const deceasedCount = React.useMemo(() => {
    return (Object.values(tree.members) as Person[]).filter((m) => m.isDeceased).length;
  }, [tree.members]);

  return (
    <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 text-slate-100 z-40 sticky top-0 px-2.5 sm:px-5 py-2 sm:py-2.5 shadow-lg select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand & Tree Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-0.5 shadow-lg shadow-amber-900/40 flex items-center justify-center shrink-0">
            <TreeDeciduous className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="font-extrabold text-xs sm:text-base text-white tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none font-royal">
                {tree.name}
              </h1>
              {tree.branchName && (
                <span className="text-[9px] sm:text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  {tree.branchName}
                </span>
              )}
            </div>

            {/* Sub Info Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400 mt-0.5">
              <div
                id="main-toolbar-total-members"
                className="flex items-center gap-1 font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded-md border border-amber-800/40 text-[9px] sm:text-[11px]"
                title="Tổng số lượng thành viên trong dòng họ"
              >
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                <span>{memberCount} người</span>
              </div>

              <div className="hidden xs:flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-300">
                <Layers className="w-3 h-3 text-blue-400" />
                <span>{generationsCount} đời</span>
              </div>

              <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-300">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{deceasedCount} tiền nhân</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* View Mode Switcher: Tree vs List */}
          <div className="bg-slate-950/90 p-0.5 sm:p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              type="button"
              id="btn-switch-tree-mode"
              onClick={() => onToggleViewMode('tree')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tree'
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng Cây Gia Phả trực quan"
            >
              <GitGraph className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[11px]">Cây</span>
            </button>

            <button
              type="button"
              id="btn-switch-list-mode"
              onClick={() => onToggleViewMode('list')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem dạng Danh Sách theo Đời (Dễ đọc trên điện thoại)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[11px]">Danh sách</span>
            </button>
          </div>

          {/* Fullscreen Toggle Button (Ẩn thanh trình duyệt để tối đa không gian xem sơ đồ) */}
          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1 text-xs"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình (Ẩn thanh trình duyệt)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden lg:inline text-[11px]">Toàn màn hình</span>
          </button>

          {/* Kinship Lookup Button (Desktop) */}
          <button
            type="button"
            id="btn-nav-kinship"
            onClick={onOpenKinship}
            className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl border border-amber-600/40 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Tra cứu xưng hô quan hệ giữa 2 người bất kỳ"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Tra Cứu Xưng Hô</span>
          </button>

          {/* Death Anniversaries Button (Desktop) */}
          <button
            type="button"
            id="btn-nav-anniversaries"
            onClick={onOpenAnniversaries}
            className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Xem cuốn lịch ngày giỗ âm/dương lịch"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Lịch Ngày Giỗ</span>
          </button>

          {/* Backup / Export Excel Button (Desktop) */}
          <button
            type="button"
            id="btn-nav-backup"
            onClick={onOpenBackup}
            className="hidden lg:flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-700/60 transition-all hover:scale-105 active:scale-95 shadow-md"
            title="Xuất/Nhập file Excel (.xlsx) & JSON sao lưu"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Sao Lưu Excel</span>
          </button>

          {/* Account / Admin Button */}
          <button
            type="button"
            id="btn-nav-auth"
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 text-xs font-semibold ${
              isAdmin
                ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-600/70 shadow-amber-950/30'
                : user
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-500 shadow-md'
            }`}
            title={isAdmin ? 'Tài khoản Quản Trị Viên (Admin)' : 'Đăng nhập Quản trị'}
          >
            {user ? (
              <div className="flex items-center gap-1.5">
                {isAdmin ? (
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-400/30" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                )}
                <span className="hidden sm:inline font-bold truncate max-w-[100px]">
                  {isAdmin ? 'Quản Trị' : user.name.split(' ')[0]}
                </span>
                {isAdmin && <span className="text-[10px] text-amber-300 font-extrabold">★</span>}
              </div>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200" />
                <span className="hidden sm:inline text-xs font-bold">Đăng Nhập</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


