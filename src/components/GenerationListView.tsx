import React, { useState, useMemo } from 'react';
import { FamilyTree, Person } from '../types/family';
import { formatDateDisplay } from '../utils/lunar';
import { 
  Users, 
  Search, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Flame, 
  Heart, 
  Plus, 
  Compass, 
  Edit3, 
  Trash2,
  Sparkles,
  User,
  Shield,
  Filter,
  UserPlus
} from 'lucide-react';

interface GenerationListViewProps {
  tree: FamilyTree;
  selectedPersonId: string | null;
  highlightedPersonId?: string | null;
  isAdmin?: boolean;
  onSelectPerson: (person: Person) => void;
  onAddSpouse: (person: Person) => void;
  onAddChild: (person: Person) => void;
  onAddRootAncestor: () => void;
  onQuickKinship: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
}

export const GenerationListView: React.FC<GenerationListViewProps> = ({
  tree,
  selectedPersonId,
  highlightedPersonId,
  isAdmin = false,
  onSelectPerson,
  onAddSpouse,
  onAddChild,
  onAddRootAncestor,
  onQuickKinship,
  onDeletePerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [collapsedGens, setCollapsedGens] = useState<Record<number, boolean>>({});

  const allMembers = useMemo(() => Object.values(tree.members) as Person[], [tree.members]);

  // Branches list
  const branches = useMemo(() => {
    const bSet = new Set<string>();
    allMembers.forEach((m) => {
      if (m.branch) bSet.add(m.branch);
    });
    return Array.from(bSet);
  }, [allMembers]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      // Branch filter
      if (selectedBranch !== 'all' && m.branch !== selectedBranch) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.birthOrderTitle && m.birthOrderTitle.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.deathDateLunar && m.deathDateLunar.toLowerCase().includes(q)) ||
        (m.restingPlace && m.restingPlace.toLowerCase().includes(q))
      );
    });
  }, [allMembers, selectedBranch, searchQuery]);

  // Group by generation
  const generationGroups = useMemo(() => {
    const map = new Map<number, Person[]>();
    filteredMembers.forEach((m) => {
      const g = m.generation || 1;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });

    const sortedGens = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedGens.map((genNum) => {
      const members = map.get(genNum)!;
      // Sort members within generation: root/spouses/birthOrder
      members.sort((a, b) => (a.birthOrder || 1) - (b.birthOrder || 1));
      return {
        generation: genNum,
        members,
      };
    });
  }, [filteredMembers]);

  const toggleGenCollapse = (genNum: number) => {
    setCollapsedGens((prev) => ({
      ...prev,
      [genNum]: !prev[genNum],
    }));
  };

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col overflow-hidden pb-20 md:pb-6">
      {/* Top Search & Filter Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shrink-0 space-y-2.5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên theo tên, đời, danh xưng, ngày giỗ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Branch Filter */}
          {branches.length > 1 && (
            <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Tất cả chi họ ({allMembers.length})</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Ancestor Button (Admin) */}
          {isAdmin && (
            <button
              type="button"
              id="btn-list-add-ancestor"
              onClick={onAddRootAncestor}
              className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-95 border border-amber-500/40"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Tiền Nhân</span>
            </button>
          )}
        </div>
      </div>

      {/* Generation List Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {generationGroups.length > 0 ? (
            generationGroups.map(({ generation, members }) => {
              const isCollapsed = Boolean(collapsedGens[generation]);
              const roman = romanNumerals[generation - 1] || `${generation}`;

              return (
                <div
                  key={generation}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Generation Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleGenCollapse(generation)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between border-b border-slate-800/80 hover:bg-slate-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] sm:text-xs flex items-center justify-center font-royal">
                        {roman}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm">
                          Thế Hệ {generation} (Đời {roman})
                        </span>
                        {generation === 1 && (
                          <span className="ml-1.5 text-[9px] sm:text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-full font-semibold">
                            Thủy Tổ
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-amber-400">
                        {members.length} người
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Generation Members Cards */}
                  {!isCollapsed && (
                    <div className="p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {members.map((person) => {
                        const isMale = person.gender === 'male';
                        const isFemale = person.gender === 'female';
                        const isSelected = selectedPersonId === person.id;
                        const isHighlighted = highlightedPersonId === person.id;
                        const canDelete = isAdmin && (person.childrenIds || []).length === 0;

                        // Theme classes
                        let borderClass = 'border-slate-800 hover:border-slate-700';
                        if (isSelected) borderClass = 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20';
                        else if (isHighlighted) borderClass = 'border-emerald-400 ring-2 ring-emerald-400/40';
                        else if (person.isDeceased) borderClass = 'border-amber-800/50 hover:border-amber-700';
                        else if (isMale) borderClass = 'border-blue-800/40 hover:border-blue-600/60';
                        else if (isFemale) borderClass = 'border-rose-800/40 hover:border-rose-600/60';

                        return (
                          <div
                            key={person.id}
                            id={`list-member-${person.id}`}
                            onClick={() => onSelectPerson(person)}
                            className={`bg-slate-950/70 border rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 cursor-pointer transition-all duration-150 relative group ${borderClass}`}
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3">
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                {person.avatarUrl ? (
                                  <img
                                    src={person.avatarUrl}
                                    alt={person.fullName}
                                    referrerPolicy="no-referrer"
                                    className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 ${
                                      person.isDeceased
                                        ? 'border-amber-600/80 grayscale-[20%]'
                                        : isMale
                                        ? 'border-blue-500/80'
                                        : 'border-rose-500/80'
                                    }`}
                                  />
                                ) : (
                                  <div
                                    className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 ${
                                      person.isDeceased
                                        ? 'bg-amber-950 text-amber-200 border-amber-600/80'
                                        : isMale
                                        ? 'bg-blue-950 text-blue-200 border-blue-500/80'
                                        : 'bg-rose-950 text-rose-200 border-rose-500/80'
                                    }`}
                                  >
                                    {person.fullName.split(' ').pop()?.[0] || <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                                  </div>
                                )}
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${
                                    isMale
                                      ? 'bg-blue-600 text-white'
                                      : isFemale
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {isMale ? '♂' : isFemale ? '♀' : '•'}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="font-bold text-slate-100 text-xs sm:text-sm truncate group-hover:text-amber-300 transition-colors">
                                    {person.fullName}
                                  </h4>
                                  {person.isDeceased ? (
                                    <span className="shrink-0 flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-medium text-amber-300 bg-amber-950/60 px-1 sm:px-1.5 py-0.5 rounded border border-amber-800/40">
                                      <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" />
                                      <span>Đã mất</span>
                                    </span>
                                  ) : (
                                    <span className="shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-emerald-400 bg-emerald-950/60 px-1 sm:px-1.5 py-0.5 rounded border border-emerald-800/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      <span>Còn sống</span>
                                    </span>
                                  )}
                                </div>

                                {/* Order title or branch */}
                                <div className="flex items-center gap-1 text-[9.5px] sm:text-[11px] text-slate-400 mt-0.5 flex-wrap">
                                  {person.birthOrderTitle && (
                                    <span className="bg-slate-800 text-amber-300/90 px-1.5 py-0.5 rounded font-medium">
                                      {person.birthOrderTitle}
                                    </span>
                                  )}
                                  {person.branch && (
                                    <span className="text-slate-400">
                                      • {person.branch}
                                    </span>
                                  )}
                                </div>

                                {/* Dates */}
                                <div className="text-[9.5px] sm:text-[11px] text-slate-400 mt-0.5 space-y-0.5">
                                  {person.birthDate && (
                                    <div className="truncate">
                                      <span className="text-slate-500">Sinh:</span> {formatDateDisplay(person.birthDate)}
                                    </div>
                                  )}
                                  {person.isDeceased && (person.deathDateLunar || person.deathDateSolar) && (
                                    <div className="text-amber-300/90 truncate font-medium">
                                      <span className="text-amber-500">Giỗ:</span> {person.deathDateLunar ? person.deathDateLunar : formatDateDisplay(person.deathDateSolar)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-[9.5px] sm:text-[11px] text-slate-400 group-hover:text-amber-300 font-medium flex items-center gap-1">
                                <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Chi tiết</span>
                              </span>

                              <div className="flex items-center gap-1">
                                {isAdmin && (
                                  <>
                                    {/* Add Spouse */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddSpouse(person);
                                      }}
                                      className="p-1 sm:p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 flex items-center gap-1 text-[9.5px] sm:text-[11px] transition-colors"
                                      title="Thêm vợ/chồng"
                                    >
                                      <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
                                      <span className="hidden sm:inline">+ Vợ/Chồng</span>
                                    </button>

                                    {/* Add Child */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddChild(person);
                                      }}
                                      className="p-1 sm:p-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 flex items-center gap-1 text-[9.5px] sm:text-[11px] transition-colors"
                                      title="Thêm con"
                                    >
                                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                                      <span className="hidden sm:inline">+ Con</span>
                                    </button>
                                  </>
                                )}

                                {/* Kinship */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickKinship(person);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                                  title="Tra cứu xưng hô"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeletePerson(person);
                                    }}
                                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition-colors"
                                    title="Xóa thành viên này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-500" />
              <div className="font-semibold text-slate-300">Không tìm thấy thành viên nào phù hợp</div>
              <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
