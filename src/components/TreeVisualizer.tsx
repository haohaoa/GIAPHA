import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FamilyTree, Person } from '../types/family';
import { MemberCard } from './MemberCard';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Search, 
  Filter, 
  Sparkles, 
  Users, 
  Layers, 
  ChevronRight,
  Crosshair,
  UserPlus
} from 'lucide-react';

interface TreeVisualizerProps {
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

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  // Group members by Generation
  const generations = React.useMemo(() => {
    const genMap = new Map<number, Person[]>();
    (Object.values(tree.members) as Person[]).forEach((person) => {
      const g = person.generation || 1;
      if (!genMap.has(g)) genMap.set(g, []);
      genMap.get(g)!.push(person);
    });

    // Sort generations ascending
    const sortedGens = Array.from(genMap.keys()).sort((a, b) => a - b);
    return sortedGens.map((g) => ({
      genNumber: g,
      members: genMap.get(g)!,
    }));
  }, [tree.members]);

  // Unique branches
  const branches = React.useMemo(() => {
    const bSet = new Set<string>();
    (Object.values(tree.members) as Person[]).forEach((m) => {
      if (m.branch) bSet.add(m.branch);
    });
    return Array.from(bSet);
  }, [tree.members]);

  // Search filtered matches
  const searchMatches = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return (Object.values(tree.members) as Person[]).filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.biography && m.biography.toLowerCase().includes(q)) ||
        (m.birthOrderTitle && m.birthOrderTitle.toLowerCase().includes(q))
    );
  }, [tree.members, searchQuery]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.35), 2.2);
    setScale(newScale);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click and not clicking directly on button
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch drag & pinch-to-zoom handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
      setTouchDistance(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistance;
      const newScale = Math.min(Math.max(scale * factor, 0.35), 2.2);
      setScale(newScale);
      setTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(null);
  };

  // Zoom control buttons
  const zoomIn = () => setScale((s) => Math.min(s + 0.15, 2.2));
  const zoomOut = () => setScale((s) => Math.max(s - 0.15, 0.35));
  const resetZoom = () => {
    setScale(0.85);
    setPosition({ x: 40, y: 40 });
  };

  // Center on root or specific person
  const centerOnPerson = useCallback((personId: string) => {
    const cardEl = document.getElementById(`member-card-${personId}`);
    if (cardEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();

      // Current offset
      const targetX = containerRect.width / 2 - (cardRect.left - position.x + cardRect.width / 2) * scale;
      const targetY = containerRect.height / 2 - (cardRect.top - position.y + cardRect.height / 2) * scale;

      setPosition({ x: targetX, y: targetY });
      setScale(1.0);
    }
  }, [position.x, position.y, scale]);

  // Center tree on initial load
  useEffect(() => {
    if (tree.rootPersonId) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const width = containerRef.current.clientWidth;
          const isMobile = window.innerWidth < 640;
          const initScale = isMobile ? 0.7 : 0.95;
          setScale(initScale);
          setPosition({ x: Math.max(10, (width - (isMobile ? 320 : 600) * initScale) / 2), y: 30 });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [tree.id]);

  // Render a family lineage node recursively
  const renderLineageNode = (personId: string, visited: Set<string> = new Set()): React.ReactNode => {
    if (visited.has(personId)) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(personId);

    const person = tree.members[personId];
    if (!person) return null;

    // Filter by branch if active
    if (selectedBranch !== 'all' && person.branch && person.branch !== selectedBranch) {
      // Still show if has descendants in this branch
    }

    // Get all spouses safely
    const spouses = (person.spouseIds || [])
      .map((sId) => tree.members[sId])
      .filter((s): s is Person => Boolean(s));

    // Get all children safely
    const children = (person.childrenIds || [])
      .map((cId) => tree.members[cId])
      .filter((c): c is Person => Boolean(c))
      .sort((a, b) => (a.birthOrder || 0) - (b.birthOrder || 0));

    const isMatch = searchMatches.some((m) => m.id === person.id);

    return (
      <div key={person.id} className="flex flex-col items-center">
        {/* Person + Spouse(s) Unit */}
        <div className="flex items-center gap-3 relative z-10 px-3 py-1">
          {/* Primary Person */}
          <MemberCard
            person={person}
            isSelected={selectedPersonId === person.id}
            isHighlighted={isMatch || highlightedPersonId === person.id}
            isAdmin={isAdmin}
            onSelect={onSelectPerson}
            onAddSpouse={onAddSpouse}
            onAddChild={onAddChild}
            onQuickKinship={onQuickKinship}
            onDelete={onDeletePerson}
          />

          {/* Connected Spouses */}
          {spouses.map((spouse) => {
            const spouseMatch = searchMatches.some((m) => m.id === spouse.id);
            return (
              <React.Fragment key={spouse.id}>
                {/* Spouse connection symbol */}
                <div className="flex flex-col items-center justify-center text-rose-400 px-0.5">
                  <div className="w-4 h-0.5 bg-rose-500/60"></div>
                  <span className="text-[11px] font-bold">♥</span>
                  <div className="w-4 h-0.5 bg-rose-500/60"></div>
                </div>

                <MemberCard
                  person={spouse}
                  isSelected={selectedPersonId === spouse.id}
                  isHighlighted={spouseMatch || highlightedPersonId === spouse.id}
                  isAdmin={isAdmin}
                  onSelect={onSelectPerson}
                  onAddSpouse={onAddSpouse}
                  onAddChild={onAddChild}
                  onQuickKinship={onQuickKinship}
                  onDelete={onDeletePerson}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Children Branches with Connecting Lines */}
        {children.length > 0 && (
          <div className="relative pt-8 mt-1 flex flex-col items-center w-full">
            {/* Vertical stem down from parent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-500/80 via-blue-400 to-amber-400/80"></div>

            {/* Horizontal branch bar spanning children */}
            {children.length > 1 && (
              <div 
                className="absolute top-8 h-0.5 bg-slate-600/80"
                style={{
                  left: `${100 / (children.length * 2)}%`,
                  right: `${100 / (children.length * 2)}%`,
                }}
              ></div>
            )}

            {/* Children nodes */}
            <div className="flex items-start justify-center gap-6 sm:gap-10 w-full">
              {children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical drop line to each child */}
                  <div className="w-0.5 h-6 bg-slate-600/80 -mt-6 mb-0"></div>
                  {renderLineageNode(child.id, nextVisited)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Find all root persons (persons with no father/mother in the dataset)
  const rootPersons = React.useMemo(() => {
    const roots: Person[] = [];
    const memberList = (Object.values(tree.members) as Person[]).filter(Boolean);
    if (memberList.length === 0) return [];

    // 1. Preferred root if valid
    if (tree.rootPersonId && tree.members[tree.rootPersonId]) {
      roots.push(tree.members[tree.rootPersonId]);
    }

    // 2. Add any other members who have no father and no mother in dataset
    memberList.forEach((m) => {
      if (m.id === tree.rootPersonId) return;
      const hasFatherInTree = m.fatherId && Boolean(tree.members[m.fatherId]);
      const hasMotherInTree = m.motherId && Boolean(tree.members[m.motherId]);

      if (!hasFatherInTree && !hasMotherInTree) {
        // Check if this person is not just a spouse of an already-added root
        const isSpouseOfExistingRoot = roots.some((r) => (r.spouseIds || []).includes(m.id));
        if (!isSpouseOfExistingRoot && !roots.some((r) => r.id === m.id)) {
          roots.push(m);
        }
      }
    });

    // 3. Fallback: If no roots found, pick the member with lowest generation number
    if (roots.length === 0 && memberList.length > 0) {
      const sortedByGen = [...memberList].sort((a, b) => (a.generation || 1) - (b.generation || 1));
      roots.push(sortedByGen[0]);
    }

    return roots;
  }, [tree]);

  // State for mobile search expandable toggle
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none flex flex-col">
      {/* Top Floating Control Ribbon */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* Mobile Search Icon Button (Collapsed by default on mobile) */}
        <div className="pointer-events-auto sm:hidden flex items-center gap-1.5">
          {!isMobileSearchOpen ? (
            <button
              type="button"
              id="btn-mobile-open-search"
              onClick={() => setIsMobileSearchOpen(true)}
              className="w-9 h-9 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-200 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              title="Tìm kiếm thành viên & Lọc chi họ"
            >
              <Search className="w-4 h-4 text-amber-400" />
              {searchQuery && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-amber-600/60 shadow-2xl w-[calc(100vw-24px)] animate-fadeIn">
              <Search className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" />
              <input
                type="text"
                id="input-mobile-search-tree"
                autoFocus
                placeholder="Tìm tên, đời, danh xưng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full px-1"
              />
              {branches.length > 1 && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-slate-800 text-slate-200 text-[10px] rounded-lg px-1.5 py-1 border border-slate-700 focus:outline-none shrink-0"
                >
                  <option value="all">Tất cả chi</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsMobileSearchOpen(false);
                }}
                className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Desktop Search & Branch Filter Bar */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl max-w-sm sm:max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            id="input-search-tree"
            placeholder="Tìm theo tên, đời, danh xưng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-1.5"
            >
              ✕
            </button>
          )}

          {/* Branch Filter Dropdown */}
          {branches.length > 1 && (
            <div className="relative border-l border-slate-700/60 pl-2 shrink-0">
              <select
                id="select-branch-filter"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả chi họ</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Results Dropdown Badge if searching */}
        {searchMatches.length > 0 && searchQuery && (
          <div className="pointer-events-auto absolute top-12 left-2 sm:left-0 bg-slate-900 border border-amber-600/60 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto w-[calc(100vw-24px)] sm:w-80 z-40">
            <div className="text-[11px] font-semibold text-amber-300 mb-1 px-2 flex items-center justify-between border-b border-slate-800 pb-1">
              <span>Tìm thấy {searchMatches.length} người</span>
              <span className="text-[10px] text-slate-400">Chọn để di chuyển tới</span>
            </div>
            {searchMatches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectPerson(m);
                  centerOnPerson(m.id);
                  setIsMobileSearchOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <div>
                  <div className="font-bold text-amber-200">{m.fullName}</div>
                  <div className="text-[10px] text-slate-400">
                    Đời {m.generation} • {m.branch || 'Chi họ'} {m.isDeceased && '• (Đã mất)'}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        )}

        {/* Floating Quick Action: Add Ancestor - Only when isAdmin */}
        {isAdmin && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2">
            <button
              type="button"
              id="btn-add-ancestor-top"
              onClick={onAddRootAncestor}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-amber-500/40 transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Thủy tổ / Tiền nhân</span>
            </button>
          </div>
        )}
      </div>

      {/* Generation Rail Sidebar (Left) */}
      <div className="absolute left-3 top-20 bottom-20 z-20 hidden md:flex flex-col justify-around pointer-events-none py-4">
        {generations.map((g) => (
          <div
            key={g.genNumber}
            className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800/80 shadow-md text-center"
          >
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Thế hệ {g.genNumber}
            </div>
            <div className="text-[10px] text-slate-400">
              {g.members.length} người
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom-Right Zoom & View Controls */}
      <div className="absolute bottom-20 md:bottom-5 right-3 md:right-4 z-30 flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
        <button
          type="button"
          id="btn-zoom-in"
          onClick={zoomIn}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 active:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          id="btn-zoom-out"
          onClick={zoomOut}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 active:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="text-[10px] font-bold text-center text-slate-400 py-0.5 border-y border-slate-800">
          {Math.round(scale * 100)}%
        </div>

        <button
          type="button"
          id="btn-zoom-reset"
          onClick={resetZoom}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 active:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
          title="Đặt lại góc nhìn (100%)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          id="btn-center-root"
          onClick={() => tree.rootPersonId && centerOnPerson(tree.rootPersonId)}
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-800 active:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors"
          title="Căn giữa về Cụ tổ"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Main Pan/Zoom Canvas Area */}
      <div
        ref={containerRef}
        id="family-tree-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''} overflow-hidden`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.08) 1px, transparent 0),
            radial-gradient(circle at 20px 20px, rgba(217, 119, 6, 0.03) 1px, transparent 0)
          `,
          backgroundSize: '32px 32px, 64px 64px',
        }}
      >
        {/* Transformable Canvas Container */}
        <div
          className="inline-block transition-transform duration-75 origin-top-left"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {/* Tree Structure */}
          <div className="flex flex-col items-center gap-16 p-12 min-w-max">
            {rootPersons.length > 0 ? (
              rootPersons.map((root) => (
                <div key={root.id} className="flex flex-col items-center">
                  {renderLineageNode(root.id)}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 max-w-md">
                <Users className="w-12 h-12 text-amber-500 mb-3" />
                <h3 className="text-lg font-bold text-slate-100 mb-1">Cây Gia Phả Chưa Có Thành Viên</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Bắt đầu lập gia phả bằng cách tạo thông tin Thủy tổ / Tiền nhân đời thứ nhất hoặc nhập dữ liệu từ file Excel.
                </p>
                <button
                  type="button"
                  onClick={onAddRootAncestor}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-lg"
                >
                  + Thêm Thủy tổ (Đời 1)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Hint on Mobile */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-slate-500 bg-slate-950/70 px-2.5 py-1 rounded-lg backdrop-blur-sm hidden sm:block border border-slate-800/40">
        💡 Kéo để di chuyển • Lăn chuột/Chụm ngón tay để phóng to/thu nhỏ • Bấm vào thẻ để sửa
      </div>
    </div>
  );
};
