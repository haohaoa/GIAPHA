import React, { useState, useRef } from 'react';
import { PRESET_AVATARS, compressImageFile } from '../utils/avatars';
import { Link2, Image, Upload, Trash2, Check, Sparkles } from 'lucide-react';

interface AvatarSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  gender?: 'male' | 'female' | 'other';
  isDeceased?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  value = '',
  onChange,
  gender = 'male',
  isDeceased = false,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'preset' | 'device'>('url');
  const [inputUrl, setInputUrl] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal input when value changes externally
  React.useEffect(() => {
    setInputUrl(value);
  }, [value]);

  const handleUrlBlur = () => {
    onChange(inputUrl.trim());
  };

  const handlePresetSelect = (url: string) => {
    setInputUrl(url);
    onChange(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file, 260);
      setInputUrl(compressedDataUrl);
      onChange(compressedDataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi nén ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    onChange('');
  };

  // Filter presets intelligently based on gender/deceased
  const filteredPresets = PRESET_AVATARS.filter((p) => {
    if (gender === 'male') return p.gender === 'male';
    if (gender === 'female') return p.gender === 'female';
    return true;
  });

  return (
    <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-amber-400" />
          <span>Hình ảnh đại diện / Chân dung</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa ảnh</span>
          </button>
        )}
      </div>

      {/* Preview and Selector Tabs */}
      <div className="flex items-center gap-3">
        {/* Avatar Preview Box */}
        <div className="relative shrink-0">
          {value ? (
            <img
              src={value}
              alt="Avatar preview"
              referrerPolicy="no-referrer"
              className={`w-14 h-14 rounded-full object-cover border-2 ${
                isDeceased ? 'border-amber-600/80 grayscale-[20%]' : 'border-amber-500'
              } shadow-md`}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500 text-xs text-center font-medium">
              Chưa có
            </div>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'url' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Dán Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'preset' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Ảnh Mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'device' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Từ Máy</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Dán link URL */}
      {activeTab === 'url' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                onChange(e.target.value);
              }}
              onBlur={handleUrlBlur}
              placeholder="Dán đường link ảnh vào đây (https://...)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            💡 Bạn có thể dán liên kết ảnh từ Google Photos, Imgur, Facebook hoặc bất kỳ trang web nào.
          </p>
        </div>
      )}

      {/* Tab 2: Chọn nhanh ảnh chân dung mẫu truyền thống */}
      {activeTab === 'preset' && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Chọn 1 chân dung phù hợp (Bấm để áp dụng):</span>
            <span className="text-amber-400">Tối ưu cho dòng họ</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square text-left ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-500/50 scale-95' : 'border-slate-800 hover:border-slate-600'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-600/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 text-[8px] text-slate-200 truncate text-center">
                    {preset.label.split(' ')[0]} {preset.label.split(' ')[1] || ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Tải từ thiết bị (Nén cục bộ) */}
      {activeTab === 'device' && (
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-slate-700 hover:border-amber-500 bg-slate-900/80 rounded-xl p-3 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Upload className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <div className="text-xs font-semibold text-slate-200">
              {isProcessing ? 'Đang nén ảnh...' : 'Chọn ảnh từ thư viện thiết bị'}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ảnh được nén tự động dưới 20KB và lưu cục bộ, không tốn dung lượng máy chủ.
            </p>
          </div>
          {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
};
