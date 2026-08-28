import React, { useState } from 'react';
import { Person, FamilyTree } from '../types/family';
import { formatDateDisplay, convertSolarToLunarEstimate } from '../utils/lunar';
import { AvatarSelector } from './AvatarSelector';
import { 
  X, 
  Edit3, 
  Heart, 
  Plus, 
  Trash2, 
  Compass, 
  Flame, 
  FileText, 
  Users, 
  Check, 
  AlertTriangle,
  UserCheck,
  Lock,
  Info
} from 'lucide-react';

interface MemberDrawerProps {
  person: Person | null;
  tree: FamilyTree;
  isOpen: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onSavePerson: (updatedPerson: Person) => void;
  onDeletePerson: (personId: string) => void;
  onAddChild: (parent: Person) => void;
  onAddSpouse: (person: Person) => void;
  onAddParent: (person: Person) => void;
  onOpenKinshipLookup: (person: Person) => void;
}

export const MemberDrawer: React.FC<MemberDrawerProps> = ({
  person,
  tree,
  isOpen,
  isAdmin = false,
  onClose,
  onSavePerson,
  onDeletePerson,
  onAddChild,
  onAddSpouse,
  onAddParent,
  onOpenKinshipLookup,
}) => {
  if (!isOpen || !person) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Person>({ ...person });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state when person changes
  React.useEffect(() => {
    setFormData({ ...person });
    setIsEditing(false);
    setConfirmDelete(false);
  }, [person]);

  const isMale = formData.gender === 'male';
  const isFemale = formData.gender === 'female';

  // Get relatives safely
  const father = formData.fatherId ? tree.members[formData.fatherId] : null;
  const mother = formData.motherId ? tree.members[formData.motherId] : null;
  const spouses = (formData.spouseIds || []).map((id) => tree.members[id]).filter((s): s is Person => Boolean(s));
  const children = (formData.childrenIds || []).map((id) => tree.members[id]).filter((c): c is Person => Boolean(c));
  const hasChildren = children.length > 0;

  const handleInputChange = (field: keyof Person, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSolarDeathChange = (solarDate: string) => {
    const lunarEstimate = convertSolarToLunarEstimate(solarDate);
    setFormData((prev) => ({
      ...prev,
      deathDateSolar: solarDate,
      deathDateLunar: prev.deathDateLunar || lunarEstimate,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    onSavePerson(formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-50 w-full max-w-full sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-fadeIn">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-slate-950/80">
          <div className="w-12 h-1 rounded-full bg-slate-700"></div>
        </div>

        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                formData.isDeceased
                  ? 'bg-amber-500'
                  : isMale
                  ? 'bg-blue-500'
                  : isFemale
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />
            <h3 className="font-bold text-slate-100 text-base">
              {isEditing ? 'Chỉnh Sửa Thông Tin' : 'Hồ Sơ Thành Viên'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold border border-slate-700">
              Đời thứ {formData.generation}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              !isEditing ? (
                <button
                  type="button"
                  id="btn-drawer-edit-toggle"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-600/40 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...person });
                    setIsEditing(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5"
                >
                  Hủy
                </button>
              )
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                Chế độ xem
              </span>
            )}

            <button
              type="button"
              id="btn-drawer-close"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-28 sm:pb-8 space-y-6">
          {isEditing && isAdmin ? (
            /* === EDIT MODE FORM === */
            <form id="form-edit-member" onSubmit={handleSave} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-edit-fullname"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Ví dụ: Nguyễn Phúc An"
                />
              </div>

              {/* Gender & Generation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Giới tính</label>
                  <select
                    id="select-edit-gender"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="male">Nam ♂</option>
                    <option value="female">Nữ ♀</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thế hệ (Đời)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    id="input-edit-generation"
                    value={formData.generation}
                    onChange={(e) => handleInputChange('generation', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Birth Order & Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thứ tự sinh trong nhà</label>
                  <input
                    type="number"
                    min="1"
                    id="input-edit-birthorder"
                    value={formData.birthOrder || 1}
                    onChange={(e) => handleInputChange('birthOrder', parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh xưng thứ bậc</label>
                  <input
                    type="text"
                    id="input-edit-birthordertitle"
                    value={formData.birthOrderTitle || ''}
                    onChange={(e) => handleInputChange('birthOrderTitle', e.target.value)}
                    placeholder="VD: Trưởng nam, Đích tôn..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Branch / Chi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chi / Nhánh dòng họ</label>
                <input
                  type="text"
                  id="input-edit-branch"
                  value={formData.branch || ''}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  placeholder="VD: Chi Trưởng, Chi Hai..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày / Năm sinh</label>
                <input
                  type="text"
                  id="input-edit-birthdate"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  placeholder="YYYY-MM-DD hoặc năm sinh (VD: 1965)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status: Living or Deceased Toggle */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tình trạng thành viên <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('isDeceased', false)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      !formData.isDeceased
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🌱 Còn sống</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange('isDeceased', true)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.isDeceased
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>🕯️ Đã qua đời</span>
                  </button>
                </div>
              </div>

              {/* Deceased Details */}
              {formData.isDeceased && (
                <div className="p-4 bg-gradient-to-b from-amber-950/30 to-slate-950 border border-amber-700/50 rounded-2xl space-y-3.5 shadow-lg">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 border-b border-amber-800/40 pb-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Thông Tin Ngày Mất, Ngày Giỗ & Mộ Phần</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      Ngày mất (Dương lịch)
                    </label>
                    <input
                      type="date"
                      id="input-edit-death-solar"
                      value={formData.deathDateSolar || ''}
                      onChange={(e) => handleSolarDeathChange(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-800/60 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                    {formData.deathDateSolar && (
                      <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                        <span>Âm lịch ước tính:</span>
                        <strong className="underline">{convertSolarToLunarEstimate(formData.deathDateSolar)}</strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      Ngày giỗ chính (Âm lịch) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="input-edit-death-lunar"
                      value={formData.deathDateLunar || ''}
                      onChange={(e) => handleInputChange('deathDateLunar', e.target.value)}
                      placeholder="VD: 15 tháng 7 hoặc 26/06 Âm lịch"
                      className="w-full bg-slate-900 border border-amber-800/60 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                    
                    {/* Quick helper chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                      <span className="text-slate-400">Gợi ý nhanh:</span>
                      {['15 tháng 7 (Vu Lan)', '15 tháng Giêng', 'Mùng 1', 'Ngày 15 (Rằm)', '25 tháng Chạp'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleInputChange('deathDateLunar', chip)}
                          className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1">
                      Nơi an táng / Mộ phần (Vị trí an nghỉ)
                    </label>
                    <input
                      type="text"
                      id="input-edit-restingplace"
                      value={formData.restingPlace || ''}
                      onChange={(e) => handleInputChange('restingPlace', e.target.value)}
                      placeholder="VD: Nghĩa trang quê nhà thôn Đông, Đồi Thông..."
                      className="w-full bg-slate-900 border border-amber-800/60 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Contact Info (if living) */}
              {!formData.isDeceased && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        id="input-edit-phone"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="VD: 0912..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        id="input-edit-email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Địa chỉ sinh sống</label>
                    <input
                      type="text"
                      id="input-edit-address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="VD: Quận Ba Đình, Hà Nội"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Biography & Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tiểu sử & Thành tựu</label>
                <textarea
                  rows={3}
                  id="input-edit-biography"
                  value={formData.biography || ''}
                  onChange={(e) => handleInputChange('biography', e.target.value)}
                  placeholder="Công đức, sự nghiệp, dấu ấn cuộc đời..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  id="input-edit-notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Ghi chú dòng tộc, tập tục..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Avatar Selector with Image URL, Presets, and Local Compress */}
              <AvatarSelector
                value={formData.avatarUrl || ''}
                onChange={(url) => handleInputChange('avatarUrl', url)}
                gender={formData.gender}
                isDeceased={formData.isDeceased}
              />

              {/* Save / Submit Button */}
              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  id="btn-save-member-form"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          ) : (
            /* === VIEW MODE === */
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
                <div className="relative shrink-0">
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt={person.fullName}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-500/80 shadow-md"
                    />
                  ) : (
                    <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center text-lg sm:text-xl font-bold text-amber-200">
                      {person.fullName.split(' ').pop()?.[0] || 'N'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold ${
                      isMale ? 'bg-blue-600 text-white' : isFemale ? 'bg-rose-600 text-white' : 'bg-slate-700'
                    }`}
                  >
                    {isMale ? '♂' : isFemale ? '♀' : '•'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-white truncate">{person.fullName}</h2>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                    <span className="text-[10px] sm:text-xs text-amber-400 bg-amber-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-amber-800/40 font-semibold">
                      Đời {person.generation}
                    </span>
                    {person.birthOrderTitle && (
                      <span className="text-[10px] sm:text-xs text-slate-300 bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded border border-slate-700">
                        {person.birthOrderTitle}
                      </span>
                    )}
                    {person.branch && (
                      <span className="text-[10px] sm:text-xs text-blue-300 bg-blue-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-blue-800/40">
                        {person.branch}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Guest / Viewer Notice */}
              {!isAdmin && (
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-2 text-xs text-blue-200">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Bạn đang xem cây gia phả ở chế độ công khai. Đăng nhập tài khoản Quản Trị Viên (Admin) để có quyền thêm, sửa đổi thông tin hoặc xóa thành viên.
                  </span>
                </div>
              )}

              {/* Dates & Status Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">Ngày sinh</span>
                    <span className="font-semibold text-slate-200">
                      {formatDateDisplay(person.birthDate) || 'Chưa rõ'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 block mb-1">Tình trạng</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      {person.isDeceased ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-amber-400" /> Đã qua đời
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          🌱 Còn sống
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Edit Status for Admin */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{person.isDeceased ? 'Chỉnh sửa Ngày Giỗ / Mộ Phần' : 'Cập nhật trạng thái: Đã Mất & Ngày Giỗ'}</span>
                  </button>
                )}
              </div>

              {/* Deceased details if deceased */}
              {person.isDeceased && (
                <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Thông Tin Ngày Giỗ & An Táng
                  </h4>
                  {person.deathDateSolar && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày mất (Dương lịch):</span>
                      <span className="text-slate-200 font-medium">{formatDateDisplay(person.deathDateSolar)}</span>
                    </div>
                  )}
                  {person.deathDateLunar && (
                    <div className="flex justify-between">
                      <span className="text-amber-400 font-medium">Ngày giỗ chính (Âm lịch):</span>
                      <span className="text-amber-300 font-bold">{person.deathDateLunar}</span>
                    </div>
                  )}
                  {person.restingPlace && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nơi an nghỉ (Mộ phần):</span>
                      <span className="text-slate-200">{person.restingPlace}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Biography */}
              {person.biography && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Tiểu Sử & Sự Nghiệp
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    {person.biography}
                  </p>
                </div>
              )}

              {/* Notes */}
              {person.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ghi Chú</h4>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    {person.notes}
                  </p>
                </div>
              )}

              {/* Family Relationships Overview */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Mối Quan Hệ Gia Đình
                </h4>

                {/* Parents */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-slate-400 font-medium">Cha Mẹ:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {father ? (
                      <span className="bg-slate-800 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-900/60">
                        Bố: {father.fullName}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Chưa liên kết Cha</span>
                    )}
                    {mother ? (
                      <span className="bg-slate-800 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-900/60">
                        Mẹ: {mother.fullName}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Chưa liên kết Mẹ</span>
                    )}
                  </div>
                </div>

                {/* Spouses */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-slate-400 font-medium">Bạn Đời (Vợ/Chồng):</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {spouses.length > 0 ? (
                      spouses.map((s) => (
                        <span key={s.id} className="bg-rose-950/40 text-rose-300 px-2.5 py-1 rounded-lg border border-rose-800/40">
                          ♥ {s.fullName} ({s.birthOrderTitle || 'Bạn đời'})
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">Chưa có thông tin vợ/chồng</span>
                    )}
                  </div>
                </div>

                {/* Children */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-slate-400 font-medium">
                    Con Cái ({children.length}):
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {children.length > 0 ? (
                      children.map((c) => (
                        <span key={c.id} className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700">
                          {c.gender === 'male' ? '♂' : '♀'} {c.fullName}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">Chưa có thông tin con</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Kinship Quick Action */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-drawer-kinship"
                  onClick={() => onOpenKinshipLookup(person)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold py-2.5 rounded-xl border border-amber-600/40 flex items-center justify-center gap-2 transition-colors"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Tra cứu xưng hô quan hệ với người này</span>
                </button>
              </div>

              {/* Quick Action Add Nodes - ONLY for Admin */}
              {isAdmin && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    id="btn-drawer-add-child"
                    onClick={() => onAddChild(person)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 p-2.5 rounded-xl border border-blue-600/40 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Con</span>
                  </button>
                  <button
                    type="button"
                    id="btn-drawer-add-spouse"
                    onClick={() => onAddSpouse(person)}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 p-2.5 rounded-xl border border-rose-600/40 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Thêm Vợ/Chồng</span>
                  </button>
                  <button
                    type="button"
                    id="btn-drawer-add-parent"
                    onClick={() => onAddParent(person)}
                    className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 p-2.5 rounded-xl border border-amber-600/40 flex flex-col items-center gap-1 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Thêm Cha/Mẹ</span>
                  </button>
                </div>
              )}

              {/* Delete Member / Bottom-Up Deletion Rule Notice */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-800">
                  {hasChildren ? (
                    /* Rule: Cannot delete ancestors who have children */
                    <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-1.5 text-xs text-amber-200">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Quy tắc gia phả: Không được xóa bậc tiền nhân</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {person.fullName} hiện đang có <strong>{children.length} người con</strong> ({children.map((c) => c.fullName).join(', ')}). 
                        Theo quy tắc bảo toàn tính liên tục của cây gia phả, chỉ được phép xóa từ đời con cháu (nhánh dưới cùng không có con) lên. 
                        Bạn có thể chọn nút <strong>Sửa</strong> để thay đổi thông tin/tiểu sử.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-drawer-ask-delete"
                      onClick={() => onDeletePerson(person.id)}
                      className="w-full text-xs text-red-400 hover:text-red-300 py-2.5 hover:bg-red-950/40 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-red-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa thành viên này khỏi cây gia phả</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
