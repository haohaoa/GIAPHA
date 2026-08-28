import React, { useState, useMemo } from 'react';
import { FamilyTree, Person } from '../types/family';
import { calculateKinship } from '../utils/kinshipCalculator';
import { 
  X, 
  Compass, 
  ArrowRightLeft, 
  GitCommit, 
  Sparkles, 
  Info, 
  Users, 
  ChevronRight,
  Search,
  CheckCircle2
} from 'lucide-react';

interface KinshipModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  initialPerson1Id?: string | null;
  initialPerson2Id?: string | null;
  onClose: () => void;
}

export const KinshipModal: React.FC<KinshipModalProps> = ({
  isOpen,
  tree,
  initialPerson1Id,
  initialPerson2Id,
  onClose,
}) => {
  if (!isOpen) return null;

  const memberList = useMemo(() => Object.values(tree.members), [tree.members]);

  // Default selection
  const [p1Id, setP1Id] = useState<string>(() => {
    if (initialPerson1Id && tree.members[initialPerson1Id]) return initialPerson1Id;
    return memberList[memberList.length - 1]?.id || '';
  });

  const [p2Id, setP2Id] = useState<string>(() => {
    if (initialPerson2Id && tree.members[initialPerson2Id] && initialPerson2Id !== initialPerson1Id) {
      return initialPerson2Id;
    }
    return tree.rootPersonId || memberList[0]?.id || '';
  });

  const [searchP1, setSearchP1] = useState('');
  const [searchP2, setSearchP2] = useState('');

  const person1 = tree.members[p1Id];
  const person2 = tree.members[p2Id];

  // Calculate Kinship Result
  const kinship = useMemo(() => {
    if (!p1Id || !p2Id || !person1 || !person2) return null;
    return calculateKinship(p1Id, p2Id, tree.members);
  }, [p1Id, p2Id, person1, person2, tree.members]);

  // Swap function
  const handleSwap = () => {
    setP1Id(p2Id);
    setP2Id(p1Id);
  };

  // Filtered lists
  const filteredList1 = useMemo(() => {
    if (!searchP1.trim()) return memberList;
    const q = searchP1.toLowerCase();
    return memberList.filter((m) => m.fullName.toLowerCase().includes(q) || (m.birthOrderTitle && m.birthOrderTitle.toLowerCase().includes(q)));
  }, [memberList, searchP1]);

  const filteredList2 = useMemo(() => {
    if (!searchP2.trim()) return memberList;
    const q = searchP2.toLowerCase();
    return memberList.filter((m) => m.fullName.toLowerCase().includes(q) || (m.birthOrderTitle && m.birthOrderTitle.toLowerCase().includes(q)));
  }, [memberList, searchP2]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Tra Cứu Quan Hệ Xưng Hô</h3>
              <p className="text-[11px] text-slate-400">
                Tính toán danh xưng chuẩn mực văn hóa dòng tộc Việt Nam
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-kinship-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Dual Selection Container */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-3 items-center">
            {/* Person 1 Selector */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Thành viên 1 (Người xưng hô)
              </label>

              <div className="relative">
                <select
                  id="select-kinship-p1"
                  value={p1Id}
                  onChange={(e) => setP1Id(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {filteredList1.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (Đời {m.generation}{m.birthOrderTitle ? ` - ${m.birthOrderTitle}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {person1 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-7 h-7 rounded-full bg-blue-950 border border-blue-700 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {person1.fullName.split(' ').pop()?.[0]}
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-slate-200 truncate">{person1.fullName}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {person1.gender === 'male' ? 'Nam' : 'Nữ'} • Đời {person1.generation} • {person1.branch || 'Chi họ'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                id="btn-swap-kinship"
                onClick={handleSwap}
                title="Đổi chiều xưng hô"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-amber-400 flex items-center justify-center shadow-lg transition-transform hover:rotate-180 duration-200"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Person 2 Selector */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                Thành viên 2 (Đối tượng cần gọi)
              </label>

              <div className="relative">
                <select
                  id="select-kinship-p2"
                  value={p2Id}
                  onChange={(e) => setP2Id(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                >
                  {filteredList2.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (Đời {m.generation}{m.birthOrderTitle ? ` - ${m.birthOrderTitle}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {person2 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700 text-rose-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {person2.fullName.split(' ').pop()?.[0]}
                  </div>
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-slate-200 truncate">{person2.fullName}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {person2.gender === 'male' ? 'Nam' : 'Nữ'} • Đời {person2.generation} • {person2.branch || 'Chi họ'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Computed Results Card */}
          {kinship && person1 && person2 && (
            <div className="space-y-4">
              {/* Highlight Reciprocal Titles */}
              <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-blue-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>KẾT QUẢ XƯNG HÔ CHÍNH XÁC</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* P1 calls P2 */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-600/40 flex flex-col justify-between">
                    <div className="text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-amber-300">{person1.fullName}</span> gọi{' '}
                      <span className="font-semibold text-blue-300">{person2.fullName}</span> là:
                    </div>
                    <div className="text-lg font-black text-amber-300 tracking-tight">
                      "{kinship.person1Title}"
                    </div>
                  </div>

                  {/* P2 calls P1 */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-600/40 flex flex-col justify-between">
                    <div className="text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-blue-300">{person2.fullName}</span> gọi{' '}
                      <span className="font-semibold text-amber-300">{person1.fullName}</span> là:
                    </div>
                    <div className="text-lg font-black text-blue-300 tracking-tight">
                      "{kinship.person2Title}"
                    </div>
                  </div>
                </div>

                {/* Description explanation */}
                <div className="mt-3 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{kinship.description}</p>
                </div>
              </div>

              {/* Lineage Step-by-Step Breadcrumbs */}
              {kinship.pathDescription && kinship.pathDescription.length > 0 && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                    Sơ Đồ Kết Nối Phả Hệ
                  </h4>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 pt-1">
                    {kinship.pathDescription.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-medium">
                          {step}
                        </span>
                        {idx < kinship.pathDescription.length - 1 && (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural Context Note */}
              <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-amber-400">💡 Quy tắc văn hóa dòng họ:</span> Người Việt Nam xưng hô dựa trên thứ bậc thế hệ (Đời trước / Đời sau) và thứ tự cành nhánh (Bác / Chú / Cô / Cậu / Dì). Dù người ít tuổi hơn nhưng thuộc cành trưởng/trên thì vai vế trong họ vẫn cao hơn.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
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
