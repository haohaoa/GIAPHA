import React, { useState, useMemo } from 'react';
import { FamilyTree, Person } from '../types/family';
import { 
  formatDateDisplay, 
  convertSolarToLunar, 
  parseLunarDayMonth, 
  LUNAR_MONTH_NAMES,
  getCanChiYear
} from '../utils/lunar';
import { 
  X, 
  Flame, 
  Calendar as CalendarIcon, 
  MapPin, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  User, 
  Sparkles,
  CalendarDays,
  ListFilter,
  ArrowUpRight,
  Clock,
  Compass
} from 'lucide-react';

interface DeathAnniversariesModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
}

export const DeathAnniversariesModal: React.FC<DeathAnniversariesModalProps> = ({
  isOpen,
  tree,
  onClose,
  onSelectPerson,
}) => {
  if (!isOpen) return null;

  // View state: 'calendar' (Cuốn Lịch Tháng) vs 'list' (Danh sách tổng hợp)
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  
  // Calendar Navigation
  const now = new Date();
  const currentLunar = useMemo(() => convertSolarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear()), []);
  const [selectedLunarMonth, setSelectedLunarMonth] = useState<number>(currentLunar.month);
  const [selectedLunarYear, setSelectedLunarYear] = useState<number>(currentLunar.year);
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ day: number; persons: Person[] } | null>(null);

  // Search in list view
  const [search, setSearch] = useState('');

  // All deceased members
  const deceasedMembers = useMemo(() => {
    return (Object.values(tree.members) as Person[])
      .filter((m) => m.isDeceased)
      .sort((a, b) => (a.generation || 1) - (b.generation || 1));
  }, [tree.members]);

  // Index deceased members by Lunar Day and Month
  const lunarAnniversariesMap = useMemo(() => {
    // Map key: "day_month" -> Array of Person
    const map = new Map<string, Person[]>();

    deceasedMembers.forEach((person) => {
      let matched = false;

      // 1. Check explicit deathDateLunar
      if (person.deathDateLunar) {
        const parsed = parseLunarDayMonth(person.deathDateLunar);
        if (parsed) {
          const key = `${parsed.day}_${parsed.month}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(person);
          matched = true;
        }
      }

      // 2. If not parsed or also check solar death date converted to lunar
      if (!matched && person.deathDateSolar) {
        const match = person.deathDateSolar.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) {
          const y = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const d = parseInt(match[3], 10);
          const lunar = convertSolarToLunar(d, m, y);
          const key = `${lunar.day}_${lunar.month}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(person);
        }
      }
    });

    return map;
  }, [deceasedMembers]);

  // Days in current selected lunar month (typically 29 or 30 days)
  const daysInCurrentMonth = useMemo(() => {
    // Standard lunar month has 30 or 29 days
    return 30;
  }, []);

  // Anniversaries occurring in current lunar month
  const thisMonthAnniversaries = useMemo(() => {
    const list: { day: number; person: Person }[] = [];
    for (let d = 1; d <= 30; d++) {
      const key = `${d}_${selectedLunarMonth}`;
      const persons = lunarAnniversariesMap.get(key) || [];
      persons.forEach((p) => list.push({ day: d, person: p }));
    }
    return list.sort((a, b) => a.day - b.day);
  }, [lunarAnniversariesMap, selectedLunarMonth]);

  // Filtered deceased list for list tab
  const filteredDeceased = useMemo(() => {
    if (!search.trim()) return deceasedMembers;
    const q = search.toLowerCase().trim();
    return deceasedMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.deathDateLunar && m.deathDateLunar.toLowerCase().includes(q)) ||
        (m.restingPlace && m.restingPlace.toLowerCase().includes(q)) ||
        (m.birthOrderTitle && m.birthOrderTitle.toLowerCase().includes(q)) ||
        (m.branch && m.branch.toLowerCase().includes(q))
    );
  }, [deceasedMembers, search]);

  const handlePrevMonth = () => {
    if (selectedLunarMonth === 1) {
      setSelectedLunarMonth(12);
      setSelectedLunarYear((y) => y - 1);
    } else {
      setSelectedLunarMonth((m) => m - 1);
    }
    setSelectedDayDetails(null);
  };

  const handleNextMonth = () => {
    if (selectedLunarMonth === 12) {
      setSelectedLunarMonth(1);
      setSelectedLunarYear((y) => y + 1);
    } else {
      setSelectedLunarMonth((m) => m + 1);
    }
    setSelectedDayDetails(null);
  };

  const handleJumpToday = () => {
    setSelectedLunarMonth(currentLunar.month);
    setSelectedLunarYear(currentLunar.year);
    setSelectedDayDetails(null);
  };

  const dayOfWeekHeaders = ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-5 h-5 fill-amber-400/30 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Lịch Ngày Giỗ Dòng Họ</span>
                <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                  Âm Lịch
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Tưởng nhớ {deceasedMembers.length} bậc tiền nhân & theo dõi ngày cúng giỗ hàng năm
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-anniversary-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls: Calendar vs List */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              type="button"
              id="tab-anniversary-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Cuốn Lịch Tháng</span>
            </button>

            <button
              type="button"
              id="tab-anniversary-list"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh Sách ({deceasedMembers.length})</span>
            </button>
          </div>

          {activeTab === 'calendar' && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 transition-colors shrink-0"
              title="Về tháng âm lịch hiện tại"
            >
              Hôm nay (T.{currentLunar.month} ÂL)
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {activeTab === 'calendar' ? (
            /* === INTERACTIVE LUNAR CALENDAR VIEW === */
            <div className="space-y-4">
              {/* Month Navigation Banner */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 shadow-lg">
                <button
                  type="button"
                  id="btn-calendar-prev"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-royal text-amber-300 font-extrabold text-sm sm:text-base">
                      {LUNAR_MONTH_NAMES[selectedLunarMonth - 1]}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      (Năm {getCanChiYear(selectedLunarYear)})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {thisMonthAnniversaries.length > 0 ? (
                      <span className="text-amber-400 font-semibold">
                        Có {thisMonthAnniversaries.length} ngày giỗ trong tháng này
                      </span>
                    ) : (
                      <span className="text-slate-500">Không có ngày giỗ nào trong tháng này</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-calendar-next"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select Month Dropdown */}
              <div className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto pb-1 scrollbar-none">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const hasAnniv = deceasedMembers.some((p) => {
                    if (p.deathDateLunar) {
                      const parsed = parseLunarDayMonth(p.deathDateLunar);
                      return parsed?.month === m;
                    }
                    return false;
                  });

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedLunarMonth(m);
                        setSelectedDayDetails(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg shrink-0 font-medium text-xs transition-all ${
                        selectedLunarMonth === m
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                          : hasAnniv
                          ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Tháng {m} {hasAnniv && '🔥'}
                    </button>
                  );
                })}
              </div>

              {/* Monthly Calendar Grid (Days 1 -> 30) */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-2.5 sm:p-4">
                {/* 6 Columns Grid for Lunar Days 1..30 (or standard 7 col) */}
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 sm:gap-2">
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                    const key = `${day}_${selectedLunarMonth}`;
                    const persons = lunarAnniversariesMap.get(key) || [];
                    const hasAnniversary = persons.length > 0;
                    const isSelected = selectedDayDetails?.day === day;
                    const isCurrentDay = currentLunar.month === selectedLunarMonth && currentLunar.day === day;

                    return (
                      <div
                        key={day}
                        id={`lunar-day-${day}-${selectedLunarMonth}`}
                        onClick={() => {
                          if (hasAnniversary) {
                            setSelectedDayDetails({ day, persons });
                          }
                        }}
                        className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-xl border flex flex-col justify-between transition-all duration-150 relative ${
                          hasAnniversary
                            ? 'bg-gradient-to-b from-amber-950/80 to-slate-950 border-amber-500/80 shadow-md shadow-amber-950/30 cursor-pointer hover:border-amber-400 hover:scale-[1.03] ring-1 ring-amber-500/30'
                            : 'bg-slate-900/50 border-slate-800/70 text-slate-400'
                        } ${isSelected ? 'ring-2 ring-amber-400 bg-amber-950/90' : ''}`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-xs sm:text-sm ${
                              hasAnniversary ? 'text-amber-300 font-royal' : 'text-slate-300'
                            }`}
                          >
                            {day <= 10 ? `Mùng ${day}` : `Ngày ${day}`}
                          </span>

                          {hasAnniversary && (
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-extrabold shadow animate-pulse">
                              🔥
                            </span>
                          )}

                          {isCurrentDay && !hasAnniversary && (
                            <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1 rounded">
                              Nay
                            </span>
                          )}
                        </div>

                        {/* Person Name prominently under date */}
                        {hasAnniversary ? (
                          <div className="mt-1 space-y-0.5">
                            {persons.slice(0, 2).map((p) => (
                              <div
                                key={p.id}
                                className="text-[10px] sm:text-[11px] font-bold text-amber-200 truncate bg-amber-900/40 px-1 py-0.5 rounded border border-amber-700/40"
                                title={`Giỗ ${p.fullName}`}
                              >
                                {p.fullName}
                              </div>
                            ))}
                            {persons.length > 2 && (
                              <div className="text-[9px] text-amber-400 font-semibold text-right">
                                +{persons.length - 2} người nữa
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 italic mt-auto">--</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Expanded Details Box */}
              {selectedDayDetails && (
                <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-4 rounded-2xl border border-amber-600/60 shadow-2xl animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-700/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-sm text-amber-300">
                        Ngày {selectedDayDetails.day} tháng {selectedLunarMonth} Âm Lịch
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDayDetails(null)}
                      className="text-xs text-slate-400 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedDayDetails.persons.map((person) => (
                      <div
                        key={person.id}
                        className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{person.fullName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                              Đời {person.generation}
                            </span>
                            {person.birthOrderTitle && (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {person.birthOrderTitle}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                            {person.deathDateSolar && (
                              <div>
                                <span className="text-slate-500">Mất (Dương lịch):</span> {formatDateDisplay(person.deathDateSolar)}
                              </div>
                            )}
                            {person.restingPlace && (
                              <div className="flex items-center gap-1 text-slate-300">
                                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{person.restingPlace}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectPerson(person);
                            onClose();
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                          title="Xem vị trí người này trên cây phả hệ"
                        >
                          <span>Xem trên cây</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* === COMPREHENSIVE LIST OF DECEASED MEMBERS === */
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên tiền nhân, ngày giỗ âm lịch, mộ phần, chi họ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              {/* Member Cards */}
              <div className="space-y-2.5">
                {filteredDeceased.length > 0 ? (
                  filteredDeceased.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => {
                        onSelectPerson(person);
                        onClose();
                      }}
                      className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-600/60 p-3.5 rounded-2xl cursor-pointer transition-all duration-150 flex items-start gap-3 group shadow-md"
                    >
                      <div className="w-11 h-11 rounded-full bg-amber-950/80 border-2 border-amber-600/80 text-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
                        {person.fullName.split(' ').pop()?.[0] || <User className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-100 text-sm group-hover:text-amber-300 transition-colors truncate">
                            {person.fullName}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold shrink-0">
                            Đời {person.generation}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          {person.birthOrderTitle && (
                            <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                              {person.birthOrderTitle}
                            </span>
                          )}
                          {person.branch && (
                            <span className="text-blue-300">• {person.branch}</span>
                          )}
                          {person.birthDate && (
                            <span>• Sinh: {formatDateDisplay(person.birthDate)}</span>
                          )}
                        </div>

                        {/* Giỗ dates container */}
                        <div className="mt-2 p-2 bg-amber-950/40 rounded-xl border border-amber-800/40 text-xs space-y-0.5">
                          {person.deathDateLunar && (
                            <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>Giỗ chính (Âm lịch): <strong>{person.deathDateLunar}</strong></span>
                            </div>
                          )}
                          {person.deathDateSolar && (
                            <div className="text-slate-400 text-[11px] pl-4">
                              <span>Mất (Dương lịch): {formatDateDisplay(person.deathDateSolar)}</span>
                            </div>
                          )}
                          {person.restingPlace && (
                            <div className="text-slate-300 flex items-start gap-1 text-[11px] pl-4 pt-0.5">
                              <MapPin className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              <span className="truncate">{person.restingPlace}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-3" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                    Không tìm thấy thông tin tiền nhân phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Dữ liệu ngày giỗ tự động đồng bộ theo cây phả hệ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
