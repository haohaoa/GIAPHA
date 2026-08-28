import React, { useState, useRef } from 'react';
import { FamilyTree, AdminCredentials, Person } from '../types/family';
import { ConfirmModal } from './ConfirmModal';
import { 
  exportFamilyTreeToExcel, 
  exportFamilyTreeToJson, 
  importFamilyTreeFromExcel, 
  importFamilyTreeFromJson,
  DEFAULT_ADMIN_CREDENTIALS
} from '../utils/backup';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  ArrowDownToLine,
  Lock,
  Key,
  LogIn,
  Crown,
  Users,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupModalProps {
  isOpen: boolean;
  tree: FamilyTree;
  isAdmin?: boolean;
  adminCreds?: AdminCredentials;
  onClose: () => void;
  onImportTree: (importedTree: FamilyTree) => void;
  onResetSample: () => void;
  onRequireAdminLogin: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  tree,
  isAdmin = false,
  adminCreds = DEFAULT_ADMIN_CREDENTIALS,
  onClose,
  onImportTree,
  onResetSample,
  onRequireAdminLogin,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<FamilyTree | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Export Excel (Only Admin)
  const handleExportExcel = () => {
    if (!isAdmin) {
      onRequireAdminLogin();
      return;
    }
    exportFamilyTreeToExcel(tree, undefined, adminCreds);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  // Handle Export JSON (Only Admin)
  const handleExportJson = () => {
    if (!isAdmin) {
      onRequireAdminLogin();
      return;
    }
    exportFamilyTreeToJson(tree, undefined, adminCreds);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportPreview(null);
    setImportFileName(file.name);

    try {
      let parsedTree: FamilyTree;
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        parsedTree = await importFamilyTreeFromExcel(file);
      } else if (lower.endsWith('.json')) {
        parsedTree = await importFamilyTreeFromJson(file);
      } else {
        throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn file .xlsx, .xls hoặc .json');
      }

      if (!parsedTree.members || Object.keys(parsedTree.members).length === 0) {
        throw new Error('Không tìm thấy dữ liệu thành viên gia phả nào trong file.');
      }

      setImportPreview(parsedTree);
    } catch (err: any) {
      setImportError(err.message || 'Lỗi đọc file dữ liệu. Vui lòng kiểm tra lại cấu trúc file.');
    } finally {
      setIsImporting(false);
      // Reset input value to allow selecting same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyImport = () => {
    if (!importPreview) return;
    onImportTree(importPreview);
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}
    onClose();
  };

  // Calculate stats for preview
  const previewStats = React.useMemo(() => {
    if (!importPreview) return null;
    const members = Object.values(importPreview.members) as Person[];
    const genSet = new Set(members.map((m) => m.generation || 1));
    const rootName = importPreview.rootPersonId && importPreview.members[importPreview.rootPersonId]
      ? importPreview.members[importPreview.rootPersonId].fullName
      : members[0]?.fullName || 'Chưa xác định';
    return {
      memberCount: members.length,
      generationsCount: genSet.size,
      rootName,
    };
  }, [importPreview]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Sao Lưu & Khôi Phục Dữ Liệu</h3>
              <p className="text-[11px] text-slate-400">
                Xuất/Nhập file Excel (.xlsx) tiêu chuẩn có bảo mật tài khoản Quản Trị
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-backup-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            type="button"
            id="tab-export-btn"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Xuất Dữ Liệu (Export)</span>
            {!isAdmin && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
          </button>

          <button
            type="button"
            id="tab-import-btn"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập File Khôi Phục (Import)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'export' ? (
            /* === EXPORT TAB === */
            <div className="space-y-4">
              {/* Permission Check Banner */}
              {!isAdmin ? (
                <div className="p-4 bg-amber-950/40 border border-amber-600/60 rounded-2xl space-y-3 text-amber-200">
                  <div className="flex items-center gap-2.5 font-bold text-amber-300">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Yêu Cầu Quyền Quản Trị Viên (Admin)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Để bảo vệ thông tin riêng tư của gia tộc, <strong className="text-amber-300">chỉ Quản Trị Viên</strong> mới có quyền tải xuống file Excel và file JSON gia phả (trong file xuất sẽ chứa kèm thông tin đăng nhập quản trị).
                  </p>
                  <button
                    type="button"
                    id="btn-export-require-auth"
                    onClick={() => {
                      onClose();
                      onRequireAdminLogin();
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-transform active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Quản Trị Viên Để Tải File</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/30 border border-emerald-700/50 rounded-xl flex items-center gap-2 text-emerald-300 text-[11px]">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Đang đăng nhập với quyền <strong>{adminCreds.displayName}</strong>. File xuất sẽ tự động đính kèm tài khoản & mật khẩu quản trị.
                  </span>
                </div>
              )}

              {/* Current Tree Stats Card */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dòng họ hiện tại:</span>
                  <span className="font-bold text-slate-200">{tree.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tổng số thành viên:</span>
                  <span className="font-bold text-amber-400">{Object.keys(tree.members).length} người</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Quê quán / Nhà thờ họ:</span>
                  <span className="text-slate-300 truncate max-w-[240px]">{tree.origin || 'Chưa cập nhật'}</span>
                </div>
                {isAdmin && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tài khoản Quản Trị đi kèm:</span>
                    <span className="text-amber-300 font-mono font-semibold">{adminCreds.username}</span>
                  </div>
                )}
              </div>

              {/* Export Excel Option */}
              <div className={`p-4 bg-slate-950/50 rounded-2xl border ${isAdmin ? 'border-slate-800 hover:border-emerald-500/50' : 'border-slate-800/60 opacity-80'} transition-colors flex items-start gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-100 mb-1 flex items-center gap-2">
                    <span>Xuất File Excel (.xlsx) Tiêu Chuẩn</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">Đầy đủ</span>
                  </h4>
                  <p className="text-slate-400 leading-relaxed mb-3 text-[11px]">
                    Đầy đủ các cột thông tin: Họ tên, Giới tính, Ngày sinh, Ngày giỗ âm/dương, Thế hệ, Cha, Mẹ, Vợ/Chồng, Con cái. <strong>File đính kèm Sheet Tài Khoản Quản Trị (Tên đăng nhập & Password)</strong>.
                  </p>
                  <button
                    type="button"
                    id="btn-download-excel"
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 text-xs"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Tải File Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Export JSON Option */}
              <div className={`p-4 bg-slate-950/50 rounded-2xl border ${isAdmin ? 'border-slate-800 hover:border-blue-500/50' : 'border-slate-800/60 opacity-80'} transition-colors flex items-start gap-4`}>
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/60 text-blue-400 flex items-center justify-center shrink-0">
                  <FileCode className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-100 mb-1">
                    Xuất File JSON Sao Lưu Cấu Trúc
                  </h4>
                  <p className="text-slate-400 leading-relaxed mb-3 text-[11px]">
                    Lưu trữ cấu trúc đồ thị gia phả nguyên bản và thông tin xác thực quản trị viên.
                  </p>
                  <button
                    type="button"
                    id="btn-download-json"
                    onClick={handleExportJson}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 text-xs"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Tải File JSON (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* === IMPORT TAB === */
            <div className="space-y-4">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/40 p-6 rounded-2xl text-center cursor-pointer transition-colors space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .json"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-950 border border-blue-700/60 text-blue-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-200 text-sm">
                  {importFileName ? importFileName : 'Nhấp hoặc kéo thả file Excel (.xlsx, .xls) hoặc JSON vào đây'}
                </div>
                <p className="text-slate-400 text-[11px]">
                  Hệ thống tự động nhận diện các cột: Họ tên, Giới tính, Ngày sinh, Ngày giỗ, Cha, Mẹ, Vợ/Chồng, Con cái để tự dựng cây phả hệ trực quan
                </p>
              </div>

              {/* Loading indicator */}
              {isImporting && (
                <div className="text-center py-3 text-blue-400 font-semibold flex items-center justify-center gap-2 animate-pulse">
                  <span>Đang phân tích cú pháp và tự động dựng liên kết cây gia phả...</span>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl flex items-start gap-2.5 text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-red-300">Không thể nhập dữ liệu:</div>
                    <p className="text-[11px] leading-relaxed">{importError}</p>
                  </div>
                </div>
              )}

              {/* Import Preview Card */}
              {importPreview && previewStats && (
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/50 shadow-xl space-y-3.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>File Hợp Lệ! Đã Dựng Thành Công Cây Gia Phả</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TÊN DÒNG HỌ</span>
                      <span className="font-bold text-slate-100 text-xs truncate block">{importPreview.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CHI / NHÁNH</span>
                      <span className="font-semibold text-amber-300 text-xs block">{importPreview.branchName || 'Chi Trưởng'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px]">TỔNG THÀNH VIÊN</span>
                      <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{previewStats.memberCount} người</span>
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px]">SỐ THẾ HỆ (ĐỜI)</span>
                      <span className="font-bold text-blue-400 text-xs flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{previewStats.generationsCount} thế hệ</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-1 pl-1">
                    <div>
                      <span className="text-slate-400">Thủy tổ / Đời đầu:</span>{' '}
                      <span className="font-semibold text-amber-300">{previewStats.rootName}</span>
                    </div>
                    {importPreview.origin && (
                      <div>
                        <span className="text-slate-400">Quê quán:</span> {importPreview.origin}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    id="btn-apply-import-tree"
                    onClick={() => setShowImportConfirm(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 text-xs mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Áp Dụng & Hiển Thị Ngay Cây Gia Phả ({previewStats.memberCount} Thành Viên)</span>
                  </button>
                </div>
              )}

              {/* Reset to Sample Tree */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  id="btn-reset-sample-tree"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full text-xs text-slate-400 hover:text-amber-300 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục về Cây gia phả mẫu (Dòng họ Nguyễn Phúc - 18 người)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl"
          >
            Đóng
          </button>
        </div>

        {/* Confirmation Modal for Reset Tree */}
        <ConfirmModal
          isOpen={showResetConfirm}
          type="warning"
          title="Xác Nhận Đặt Lại Cây Gia Phả"
          confirmText="Khôi Phục Bản Mẫu"
          cancelText="Hủy Bỏ"
          message={
            <div className="space-y-1.5 text-slate-300">
              <p>Bạn có chắc chắn muốn khôi phục về <strong>Cây gia phả mẫu chuẩn (Dòng họ Nguyễn Phúc - 18 người)</strong> không?</p>
              <p className="text-amber-300/90 text-xs">⚠️ Mọi thay đổi chưa được sao lưu ra file Excel hoặc JSON sẽ được thay thế bằng dữ liệu mẫu.</p>
            </div>
          }
          onConfirm={() => {
            setShowResetConfirm(false);
            onResetSample();
            onClose();
          }}
          onCancel={() => setShowResetConfirm(false)}
        />

        {/* Confirmation Modal for Import Tree */}
        {previewStats && importPreview && (
          <ConfirmModal
            isOpen={showImportConfirm}
            type="create"
            title="Xác Nhận Nhập Dữ Liệu Gia Phả Mới"
            confirmText="Áp Dụng Dữ Liệu Mới"
            cancelText="Kiểm Tra Lại"
            message={
              <div className="space-y-2 text-left bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
                <p className="text-slate-300 font-semibold">
                  Bạn có chắc chắn muốn nạp toàn bộ dữ liệu từ file <strong>{importFileName}</strong> vào hiển thị?
                </p>
                <div className="space-y-1 text-slate-400">
                  <div>• Tổng số thành viên: <span className="text-emerald-400 font-bold">{previewStats.memberCount} người</span></div>
                  <div>• Số thế hệ (đời): <span className="text-blue-400 font-bold">{previewStats.generationsCount} đời</span></div>
                  <div>• Thủy tổ: <span className="text-amber-300 font-bold">{previewStats.rootName}</span></div>
                </div>
              </div>
            }
            onConfirm={() => {
              setShowImportConfirm(false);
              handleApplyImport();
            }}
            onCancel={() => setShowImportConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};
