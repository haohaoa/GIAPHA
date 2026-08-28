export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD or year string
  isDeceased: boolean;
  deathDateSolar?: string; // Solar death date YYYY-MM-DD
  deathDateLunar?: string; // Lunar date e.g. "15/07 Âm lịch"
  restingPlace?: string; // Mộ phần / nơi an táng
  birthOrder?: number; // Thứ tự con trong nhà: 1, 2, 3...
  birthOrderTitle?: string; // e.g. "Trưởng nam", "Thứ nam", "Trưởng nữ", "Con út"...
  generation: number; // Đời thứ mấy (1, 2, 3...)
  branch?: string; // Chi / Nhánh (e.g. "Chi Trưởng", "Chi Hai")
  biography?: string; // Tiểu sử, công danh, sự nghiệp
  notes?: string; // Ghi chú thêm
  phone?: string;
  email?: string;
  address?: string;
  avatarUrl?: string;
  
  // Relationship IDs
  fatherId?: string | null;
  motherId?: string | null;
  spouseIds: string[]; // IDs of spouses/partners
  childrenIds: string[]; // IDs of children
}

export interface FamilyTree {
  id: string;
  name: string;
  branchName?: string;
  origin?: string; // Quê quán / Nhà thờ họ
  createdDate: string;
  updatedDate: string;
  rootPersonId: string; // Thủy tổ / Trưởng thế hệ 1
  members: Record<string, Person>;
}

export interface KinshipResult {
  person1Title: string; // P1 gọi P2 là gì (ví dụ: "Ông nội", "Chú họ")
  person2Title: string; // P2 gọi P1 là gì (ví dụ: "Cháu nội", "Cháu họ")
  description: string; // Giải thích chi tiết quan hệ
  relationshipType: 'direct' | 'sibling' | 'collateral' | 'spouse' | 'inlaw' | 'same' | 'unknown';
  pathDescription: string[]; // Các bước liên kết phả hệ
  generationDiff: number; // Cách nhau mấy thế hệ (dương: P2 lớn đời hơn, âm: P1 lớn đời hơn)
  isPaternal: boolean; // Quan hệ bên nội hay ngoại
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'password' | 'guest';
  role?: 'admin' | 'viewer';
  isAdmin?: boolean;
}

export interface AdminCredentials {
  username: string;
  password: string;
  displayName: string;
  email: string;
}
