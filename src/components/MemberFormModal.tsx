import React, { useState } from 'react';
import { Person, Gender, FamilyTree } from '../types/family';
import { convertSolarToLunarEstimate } from '../utils/lunar';
import { AvatarSelector } from './AvatarSelector';
import { ConfirmModal } from './ConfirmModal';
import { X, UserPlus, Heart, Plus, Flame, Check, AlertCircle } from 'lucide-react';

export type AddMode = 'root' | 'child' | 'spouse' | 'parent';

interface MemberFormModalProps {
  isOpen: boolean;
  mode: AddMode;
  targetPerson: Person | null;
  tree: FamilyTree;
  onClose: () => void;
  onSubmit: (newPerson: Person, mode: AddMode, targetPersonId?: string) => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  mode,
  targetPerson,
  tree,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  // Derive initial values based on mode
  const getInitialState = (): Partial<Person> => {
    let gen = 1;
    let gender: Gender = 'male';
    let birthOrder = 1;
    let birthOrderTitle = '';
    let branch = targetPerson?.branch || tree.branchName || 'Chi Trưởng';

    if (mode === 'child' && targetPerson) {
      gen = (targetPerson.generation || 1) + 1;
      const currentChildrenCount = targetPerson.childrenIds.length;
      birthOrder = currentChildrenCount + 1;
      birthOrderTitle = birthOrder === 1 ? 'Trưởng nam/nữ' : `Con thứ ${birthOrder}`;
    } else if (mode === 'spouse' && targetPerson) {
      gen = targetPerson.generation || 1;
      gender = targetPerson.gender === 'male' ? 'female' : 'male';
      birthOrderTitle = gender === 'female' ? 'Chính thất (Vợ)' : 'Phu quân (Chồng)';
    } else if (mode === 'parent' && targetPerson) {
      gen = Math.max(1, (targetPerson.generation || 2) - 1);
      gender = 'male';
      birthOrderTitle = 'Bậc sinh thành';
    } else if (mode === 'root') {
      gen = 1;
      gender = 'male';
      birthOrderTitle = 'Thủy tổ / Tiền nhân Đời 1';
    }

    return {
      fullName: '',
      gender,
      generation: gen,
      birthDate: '',
      isDeceased: mode === 'root' ? true : false,
      deathDateSolar: '',
      deathDateLunar: '',
      restingPlace: '',
      birthOrder,
      birthOrderTitle,
      branch,
      biography: '',
      notes: '',
      phone: '',
      email: '',
      address: '',
      avatarUrl: '',
      fatherId: mode === 'child' && targetPerson?.gender === 'male' ? targetPerson.id : null,
      motherId: mode === 'child' && targetPerson?.gender === 'female' ? targetPerson.id : null,
      spouseIds: mode === 'spouse' && targetPerson ? [targetPerson.id] : [],
      childrenIds: mode === 'parent' && targetPerson ? [targetPerson.id] : [],
    };
  };

  const [formData, setFormData] = useState<Partial<Person>>(getInitialState);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleFormSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName?.trim()) return;
    setShowConfirm(true);
  };

  const handleFinalConfirmCreate = () => {
    if (!formData.fullName?.trim()) return;

    const newId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPerson: Person = {
      id: newId,
      fullName: formData.fullName.trim(),
      gender: formData.gender || 'male',
      generation: formData.generation || 1,
      birthDate: formData.birthDate,
      isDeceased: Boolean(formData.isDeceased),
      deathDateSolar: formData.deathDateSolar,
      deathDateLunar: formData.deathDateLunar,
      restingPlace: formData.restingPlace,
      birthOrder: formData.birthOrder || 1,
      birthOrderTitle: formData.birthOrderTitle,
      branch: formData.branch || tree.branchName || 'Chi Trưởng',
      biography: formData.biography,
      notes: formData.notes,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      avatarUrl: formData.avatarUrl,
      fatherId: formData.fatherId || null,
      motherId: formData.motherId || null,
      spouseIds: formData.spouseIds || [],
      childrenIds: formData.childrenIds || [],
    };

    onSubmit(newPerson, mode, targetPerson?.id);
    setShowConfirm(false);
    onClose();
  };

  // Titles per mode
  const getModalTitle = () => {
    switch (mode) {
      case 'root':
        return 'Thêm Thủy Tổ / Tiền Nhân (Đời 1)';
      case 'child':
        return `Thêm Con / Cháu cho ${targetPerson?.fullName}`;
      case 'spouse':
        return `Thêm Bạn Đời (Vợ/Chồng) cho ${targetPerson?.fullName}`;
      case 'parent':
        return `Thêm Cha / Mẹ cho ${targetPerson?.fullName}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'spouse' ? (
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            ) : mode === 'child' ? (
              <Plus className="w-5 h-5 text-blue-500" />
            ) : (
              <UserPlus className="w-5 h-5 text-amber-500" />
            )}
            <h3 className="font-bold text-slate-100 text-base">{getModalTitle()}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmitAttempt} className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Họ và tên <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              id="input-new-fullname"
              autoFocus
              value={formData.fullName || ''}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="VD: Nguyễn Phúc An"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Gender & Generation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Giới tính</label>
              <select
                id="select-new-gender"
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="male">Nam ♂</option>
                <option value="female">Nữ ♀</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Thế hệ (Đời thứ)</label>
              <input
                type="number"
                min="1"
                id="input-new-generation"
                value={formData.generation || 1}
                onChange={(e) => handleInputChange('generation', parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Birth Order & Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Thứ tự sinh</label>
              <input
                type="number"
                min="1"
                id="input-new-birthorder"
                value={formData.birthOrder || 1}
                onChange={(e) => handleInputChange('birthOrder', parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Danh xưng thứ bậc</label>
              <input
                type="text"
                id="input-new-birthordertitle"
                value={formData.birthOrderTitle || ''}
                onChange={(e) => handleInputChange('birthOrderTitle', e.target.value)}
                placeholder="VD: Trưởng nam, Con út..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Branch & Birth Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Chi / Nhánh dòng họ</label>
              <input
                type="text"
                id="input-new-branch"
                value={formData.branch || ''}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="VD: Chi Trưởng"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ngày / Năm sinh</label>
              <input
                type="text"
                id="input-new-birthdate"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                placeholder="YYYY-MM-DD hoặc năm (1990)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Deceased Checkbox */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-300">
              <input
                type="checkbox"
                id="check-new-deceased"
                checked={formData.isDeceased}
                onChange={(e) => handleInputChange('isDeceased', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Đã qua đời (Nhập ngày giỗ âm/dương lịch)</span>
            </label>
          </div>

          {/* Deceased details */}
          {formData.isDeceased && (
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-amber-200 mb-1">Ngày mất (Dương lịch)</label>
                  <input
                    type="date"
                    id="input-new-deathsolar"
                    value={formData.deathDateSolar || ''}
                    onChange={(e) => handleSolarDeathChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-200 mb-1">Ngày giỗ (Âm lịch)</label>
                  <input
                    type="text"
                    id="input-new-deathlunar"
                    value={formData.deathDateLunar || ''}
                    onChange={(e) => handleInputChange('deathDateLunar', e.target.value)}
                    placeholder="VD: 15/07 Âm lịch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-amber-200 mb-1">Nơi an táng / Mộ phần</label>
                <input
                  type="text"
                  id="input-new-restingplace"
                  value={formData.restingPlace || ''}
                  onChange={(e) => handleInputChange('restingPlace', e.target.value)}
                  placeholder="Nghĩa trang quê quán..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Biography & Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tiểu sử & Công đức</label>
            <textarea
              rows={2}
              id="input-new-biography"
              value={formData.biography || ''}
              onChange={(e) => handleInputChange('biography', e.target.value)}
              placeholder="Ghi chú ngắn về thành tựu, công việc..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Avatar Selector with Image URL, Presets, and Local Compress */}
          <AvatarSelector
            value={formData.avatarUrl || ''}
            onChange={(url) => handleInputChange('avatarUrl', url)}
            gender={formData.gender}
            isDeceased={formData.isDeceased}
          />

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              id="btn-submit-new-member"
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Thêm Thành Viên</span>
            </button>
          </div>
        </form>

        {/* Confirmation Modal before creating */}
        <ConfirmModal
          isOpen={showConfirm}
          type="create"
          title="Xác Nhận Tạo Mới Thành Viên"
          confirmText="Xác Nhận Tạo Mới"
          cancelText="Kiểm Tra Lại"
          message={
            <div className="text-left bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 mt-1">
              <p className="text-slate-300 text-xs font-semibold mb-2">
                Bạn có chắc chắn muốn thêm thành viên này vào cây phả hệ dòng họ?
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Họ và tên:</span>
                  <span className="font-bold text-amber-300">{formData.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Vai vế / Mối quan hệ:</span>
                  <span className="font-semibold text-slate-200">
                    {mode === 'child'
                      ? `Con của ${targetPerson?.fullName || 'Tiền bối'}`
                      : mode === 'spouse'
                      ? `Bạn đời (Vợ/Chồng) của ${targetPerson?.fullName || 'Thành viên'}`
                      : mode === 'parent'
                      ? `Cha/Mẹ của ${targetPerson?.fullName || 'Hậu bối'}`
                      : 'Bậc Thủy Tổ / Tiền Nhân (Đời 1)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Thế hệ (Đời):</span>
                  <span className="font-semibold text-blue-300">Đời thứ {formData.generation || 1}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Chi họ:</span>
                  <span className="text-slate-300">{formData.branch || 'Chi Trưởng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className={formData.isDeceased ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {formData.isDeceased ? '🕯️ Đã qua đời' : '🌱 Còn sống'}
                  </span>
                </div>
              </div>
            </div>
          }
          onConfirm={handleFinalConfirmCreate}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
};
