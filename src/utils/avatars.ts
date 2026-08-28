export interface AvatarPreset {
  id: string;
  label: string;
  category: 'elder' | 'middle' | 'young' | 'child' | 'traditional';
  gender: 'male' | 'female' | 'other';
  url: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'cu_ong_1',
    label: 'Cụ Ông (Áo dài truyền thống)',
    category: 'elder',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'cu_ong_2',
    label: 'Cụ Ông (Phúc hậu)',
    category: 'elder',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'cu_ba_1',
    label: 'Cụ Bà (Áo dài nhung / Phúc hậu)',
    category: 'elder',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'cu_ba_2',
    label: 'Cụ Bà (Khăn vấn truyền thống)',
    category: 'elder',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'nam_trung_nien_1',
    label: 'Bác / Chú (Trung niên lịch thiệp)',
    category: 'middle',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'nu_trung_nien_1',
    label: 'Cô / Dì / Mẹ (Trung niên)',
    category: 'middle',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'thanh_nien_1',
    label: 'Thanh Niên (Nam trẻ)',
    category: 'young',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'thieu_nu_1',
    label: 'Thiếu Nữ (Nữ trẻ)',
    category: 'young',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'be_trai_1',
    label: 'Bé Trai (Hậu duệ nhỏ)',
    category: 'child',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'be_gai_1',
    label: 'Bé Gái (Hậu duệ nhỏ)',
    category: 'child',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
];

/**
 * Compresses an image file from user's device to a compact base64 data-url (~20KB)
 * so it saves locally without taking cloud storage quota.
 */
export async function compressImageFile(file: File, maxSize = 250): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as webp or jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể xử lý định dạng ảnh này.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}
