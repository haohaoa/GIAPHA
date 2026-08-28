import React from 'react';
import { Person } from '../types/family';
import { formatDateDisplay } from '../utils/lunar';
import { 
  User, 
  Heart, 
  Plus, 
  Flame, 
  Sparkles, 
  MoreHorizontal, 
  Compass, 
  Edit3, 
  Trash2 
} from 'lucide-react';

interface MemberCardProps {
  person: Person;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isAdmin?: boolean;
  onSelect: (person: Person) => void;
  onAddSpouse: (person: Person) => void;
  onAddChild: (person: Person) => void;
  onQuickKinship?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  person,
  isSelected,
  isHighlighted,
  isAdmin = false,
  onSelect,
  onAddSpouse,
  onAddChild,
  onQuickKinship,
  onDelete,
}) => {
  const isMale = person.gender === 'male';
  const isFemale = person.gender === 'female';
  // Bottom-up deletion rule: can only delete if has no children
  const canDelete = isAdmin && (person.childrenIds || []).length === 0;

  // Roman numerals for generation
  const romanGenerations = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const genLabel = romanGenerations[person.generation - 1] || `${person.generation}`;

  // Theme colors based on gender & deceased state
  const getThemeClasses = () => {
    if (person.isDeceased) {
      return {
        cardBg: 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-800/60 shadow-amber-950/20',
        badgeBg: 'bg-amber-900/40 text-amber-200 border-amber-700/50',
        accentColor: 'text-amber-300',
        borderPulse: 'ring-amber-500/50',
      };
    }
    if (isMale) {
      return {
        cardBg: 'bg-slate-900/90 hover:bg-slate-850 border-blue-700/50 shadow-blue-950/30',
        badgeBg: 'bg-blue-950/70 text-blue-300 border-blue-700/40',
        accentColor: 'text-blue-400',
        borderPulse: 'ring-blue-500/50',
      };
    }
    if (isFemale) {
      return {
        cardBg: 'bg-slate-900/90 hover:bg-slate-850 border-rose-700/50 shadow-rose-950/30',
        badgeBg: 'bg-rose-950/70 text-rose-300 border-rose-700/40',
        accentColor: 'text-rose-400',
        borderPulse: 'ring-rose-500/50',
      };
    }
    return {
      cardBg: 'bg-slate-900/90 hover:bg-slate-850 border-emerald-700/50 shadow-emerald-950/30',
      badgeBg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/40',
      accentColor: 'text-emerald-400',
      borderPulse: 'ring-emerald-500/50',
    };
  };

  const theme = getThemeClasses();

  return (
    <div className="relative group/node inline-block">
      {/* Main Node Card */}
      <div
        id={`member-card-${person.id}`}
        onClick={() => onSelect(person)}
        className={`
          w-48 sm:w-60 rounded-xl p-2.5 sm:p-3.5 cursor-pointer backdrop-blur-md transition-all duration-200
          border text-left relative shadow-lg select-none
          ${theme.cardBg}
          ${isSelected ? 'ring-2 ring-amber-400 shadow-amber-500/30 scale-[1.02]' : ''}
          ${isHighlighted ? 'ring-2 ring-emerald-400 shadow-emerald-500/40 animate-pulse' : ''}
          hover:shadow-xl hover:border-opacity-100
        `}
      >
        {/* Top Header: Generation badge & Status */}
        <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <span className={`text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
              Đời {genLabel}
            </span>
            {person.birthOrderTitle && (
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 truncate max-w-[80px] sm:max-w-[110px]" title={person.birthOrderTitle}>
                {person.birthOrderTitle}
              </span>
            )}
          </div>

          {/* Deceased / Living Status */}
          {person.isDeceased ? (
            <div className="flex items-center gap-1 text-[9.5px] sm:text-[11px] text-amber-300/90 bg-amber-950/60 px-1 sm:px-1.5 py-0.5 rounded border border-amber-800/40" title="Đã qua đời">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Đã mất</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-950/60 px-1 sm:px-1.5 py-0.5 rounded border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Còn sống</span>
            </div>
          )}
        </div>

        {/* Middle Content: Avatar & Info */}
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar / Initial */}
          <div className="relative shrink-0">
            {person.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt={person.fullName}
                referrerPolicy="no-referrer"
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 ${
                  person.isDeceased ? 'border-amber-600/80 grayscale-[20%]' : isMale ? 'border-blue-500/80' : 'border-rose-500/80'
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            {/* Fallback Icon */}
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 ${
                person.isDeceased
                  ? 'bg-amber-950 text-amber-200 border-amber-600/80'
                  : isMale
                  ? 'bg-blue-950 text-blue-200 border-blue-500/80'
                  : 'bg-rose-950 text-rose-200 border-rose-500/80'
              } ${person.avatarUrl ? 'hidden' : ''}`}
            >
              {person.fullName.split(' ').pop()?.[0] || <User className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>

            {/* Gender tiny icon */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${
                isMale ? 'bg-blue-600 text-white' : isFemale ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}
            >
              {isMale ? '♂' : isFemale ? '♀' : '•'}
            </span>
          </div>

          {/* Name & Quick Dates */}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-100 text-xs sm:text-[13px] leading-snug truncate hover:text-amber-300 transition-colors">
              {person.fullName}
            </h4>

            {/* Birth Date */}
            <div className="text-[9.5px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
              <span className="text-slate-500">Sinh:</span>
              <span className="text-slate-300">{formatDateDisplay(person.birthDate) || 'Chưa rõ'}</span>
            </div>

            {/* Death / Anniversary Date (Ngày giỗ) */}
            {person.isDeceased && (
              <div className="text-[9.5px] sm:text-[11px] text-amber-300/90 mt-0.5 flex items-start gap-1 leading-tight">
                <span className="text-amber-500/90 shrink-0 font-medium">Giỗ:</span>
                <span className="truncate font-medium text-amber-200" title={person.deathDateLunar || person.deathDateSolar || ''}>
                  {person.deathDateLunar ? `${person.deathDateLunar}` : formatDateDisplay(person.deathDateSolar) || 'Chưa ghi'}
                </span>
              </div>
            )}

            {/* Branch / Chi */}
            {person.branch && (
              <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
                <span className="text-slate-500">Chi:</span> {person.branch}
              </div>
            )}
          </div>
        </div>

        {/* Card Quick Action Bar on Hover/Focus */}
        <div className="mt-2 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[9.5px] sm:text-[11px] text-slate-400 hover:text-amber-300 font-medium flex items-center gap-1">
            <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
            Chi tiết
          </span>

          <div className="flex items-center gap-1">
            {onQuickKinship && (
              <button
                type="button"
                id={`btn-kinship-${person.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickKinship(person);
                }}
                className="p-1 rounded hover:bg-slate-700/70 text-slate-300 hover:text-amber-300 transition-colors"
                title="Tra cứu quan hệ với người này"
              >
                <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                id={`btn-delete-${person.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(person);
                }}
                className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                title="Xóa thành viên này (Đời con cháu cuối nhánh)"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Direct In-Tree Interactive Add Spouse Button (+ Thêm Vợ/Chồng) - Chỉ hiện khi Đăng nhập Quản Trị */}
      {isAdmin && (
        <button
          type="button"
          id={`btn-add-spouse-${person.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onAddSpouse(person);
          }}
          title={`Thêm vợ/chồng cho ${person.fullName}`}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform duration-150 hover:scale-115 active:scale-95 group/btn"
        >
          <Heart className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-rose-200 text-white group-hover/btn:scale-110" />
        </button>
      )}

      {/* Direct In-Tree Interactive Add Child Button (+ Thêm Con) - Chỉ hiện khi Đăng nhập Quản Trị */}
      {isAdmin && (
        <button
          type="button"
          id={`btn-add-child-${person.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(person);
          }}
          title={`Thêm con/cháu cho ${person.fullName}`}
          className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-20 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform duration-150 hover:scale-115 active:scale-95 group/btn"
        >
          <Plus className="w-4.5 h-4.5 sm:w-4 sm:h-4 stroke-[2.8] group-hover/btn:rotate-90 transition-transform" />
        </button>
      )}
    </div>
  );
};
