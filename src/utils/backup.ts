import * as XLSX from 'xlsx';
import { FamilyTree, Person, AdminCredentials } from '../types/family';

interface ExcelPersonRow {
  'Mã thành viên (ID)': string;
  'Họ và tên': string;
  'Giới tính (Nam/Nữ)': string;
  'Ngày sinh': string;
  'Tình trạng (Còn sống/Đã mất)': string;
  'Ngày giỗ (Dương lịch)': string;
  'Ngày giỗ (Âm lịch)': string;
  'Nơi an nghỉ (Mộ phần)': string;
  'Thế hệ (Đời)': number;
  'Thứ tự sinh': number;
  'Danh xưng thứ tự': string;
  'Chi/Nhánh họ': string;
  'Mã Cha (Bố)': string;
  'Mã Mẹ': string;
  'Mã Vợ/Chồng (cách nhau dấu phẩy)': string;
  'Mã Con cái (cách nhau dấu phẩy)': string;
  'Số điện thoại': string;
  'Email': string;
  'Địa chỉ': string;
  'Tiểu sử / Sự nghiệp': string;
  'Ghi chú': string;
  'Link ảnh': string;
}

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: 'haohao051103@gmail.com',
  password: 'admin',
  displayName: 'Hảo Hảo (Quản Trị Viên)',
  email: 'haohao051103@gmail.com',
};

/**
 * Normalizes Vietnamese string for robust fuzzy matching
 */
function normalizeKey(str: string): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Format Excel cell date/number to string YYYY-MM-DD or readable string
 */
function parseExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Check if numeric serial date (e.g. 35420)
  if (typeof val === 'number' && val > 10000 && val < 60000) {
    try {
      const dateObj = new Date((val - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
  }
  return String(val).trim();
}

/**
 * Export Family Tree to Excel file (.xlsx) with standard sheets & Admin credentials
 */
export function exportFamilyTreeToExcel(
  tree: FamilyTree,
  customFileName?: string,
  adminCreds: AdminCredentials = DEFAULT_ADMIN_CREDENTIALS
): void {
  // Only export valid members currently existing in tree.members
  const memberList = (Object.values(tree.members) as Person[]).filter(
    (m) => Boolean(m && m.id && m.fullName)
  );

  const memberRows: ExcelPersonRow[] = memberList.map((m) => {
    // Filter spouses and children to ensure they only contain IDs that currently exist in tree
    const validSpouseIds = (m.spouseIds || []).filter((id) => Boolean(tree.members[id]));
    const validChildrenIds = (m.childrenIds || []).filter((id) => Boolean(tree.members[id]));
    const validFatherId = m.fatherId && tree.members[m.fatherId] ? m.fatherId : '';
    const validMotherId = m.motherId && tree.members[m.motherId] ? m.motherId : '';

    return {
      'Mã thành viên (ID)': m.id,
      'Họ và tên': m.fullName,
      'Giới tính (Nam/Nữ)': m.gender === 'male' ? 'Nam' : m.gender === 'female' ? 'Nữ' : 'Khác',
      'Ngày sinh': m.birthDate || '',
      'Tình trạng (Còn sống/Đã mất)': m.isDeceased ? 'Đã mất' : 'Còn sống',
      'Ngày giỗ (Dương lịch)': m.deathDateSolar || '',
      'Ngày giỗ (Âm lịch)': m.deathDateLunar || '',
      'Nơi an nghỉ (Mộ phần)': m.restingPlace || '',
      'Thế hệ (Đời)': m.generation || 1,
      'Thứ tự sinh': m.birthOrder || 1,
      'Danh xưng thứ tự': m.birthOrderTitle || '',
      'Chi/Nhánh họ': m.branch || tree.branchName || '',
      'Mã Cha (Bố)': validFatherId,
      'Mã Mẹ': validMotherId,
      'Mã Vợ/Chồng (cách nhau dấu phẩy)': validSpouseIds.join(', '),
      'Mã Con cái (cách nhau dấu phẩy)': validChildrenIds.join(', '),
      'Số điện thoại': m.phone || '',
      'Email': m.email || '',
      'Địa chỉ': m.address || '',
      'Tiểu sử / Sự nghiệp': m.biography || '',
      'Ghi chú': m.notes || '',
      'Link ảnh': m.avatarUrl || '',
    };
  });

  // Tree meta sheet
  const metaRows = [
    { 'Thông tin': 'Tên gia phả', 'Giá trị': tree.name },
    { 'Thông tin': 'Chi họ', 'Giá trị': tree.branchName || 'Chi Trưởng' },
    { 'Thông tin': 'Quê quán / Nhà thờ họ', 'Giá trị': tree.origin || '' },
    { 'Thông tin': 'Tổng số thành viên', 'Giá trị': memberList.length },
    { 'Thông tin': 'Mã Thủy tổ / Trưởng đời 1', 'Giá trị': tree.rootPersonId },
    { 'Thông tin': 'Tên đăng nhập Quản Trị (Admin)', 'Giá trị': adminCreds.username },
    { 'Thông tin': 'Mật khẩu Quản Trị (Password)', 'Giá trị': adminCreds.password },
    { 'Thông tin': 'Tên người quản trị', 'Giá trị': adminCreds.displayName },
    { 'Thông tin': 'Ngày xuất file', 'Giá trị': new Date().toLocaleString('vi-VN') },
  ];

  // Dedicated Admin Account Sheet
  const adminAccountRows = [
    { 'Mục thông tin': 'Tên đăng nhập Quản Trị (Username/Email)', 'Giá trị': adminCreds.username },
    { 'Mục thông tin': 'Mật khẩu đăng nhập Quản Trị (Password)', 'Giá trị': adminCreds.password },
    { 'Mục thông tin': 'Tên hiển thị Quản Trị Viên', 'Giá trị': adminCreds.displayName },
    { 'Mục thông tin': 'Email liên hệ', 'Giá trị': adminCreds.email },
    { 'Mục thông tin': 'Quyền hạn tài khoản', 'Giá trị': 'Toàn quyền Quản Trị Viên (Thêm, Sửa, Xóa, Xuất/Nhập dữ liệu)' },
    { 'Mục thông tin': 'Thời điểm tạo file', 'Giá trị': new Date().toLocaleString('vi-VN') },
    { 'Mục thông tin': 'Lưu ý bảo mật', 'Giá trị': 'Vui lòng lưu giữ file và thông tin đăng nhập cẩn thận để quản trị gia phả.' },
  ];

  const wb = XLSX.utils.book_new();

  const wsMembers = XLSX.utils.json_to_sheet(memberRows);
  const wsMeta = XLSX.utils.json_to_sheet(metaRows);
  const wsAdmin = XLSX.utils.json_to_sheet(adminAccountRows);

  // Column widths
  wsMembers['!cols'] = [
    { wch: 18 }, // ID
    { wch: 22 }, // Họ tên
    { wch: 10 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 14 }, // Tình trạng
    { wch: 16 }, // Giỗ dương
    { wch: 16 }, // Giỗ âm
    { wch: 20 }, // Nơi an nghỉ
    { wch: 12 }, // Thế hệ
    { wch: 12 }, // Thứ tự
    { wch: 16 }, // Danh xưng
    { wch: 16 }, // Chi họ
    { wch: 14 }, // Cha
    { wch: 14 }, // Mẹ
    { wch: 20 }, // Vợ/Chồng
    { wch: 20 }, // Con cái
    { wch: 14 }, // SĐT
    { wch: 20 }, // Email
    { wch: 25 }, // Địa chỉ
    { wch: 30 }, // Tiểu sử
    { wch: 25 }, // Ghi chú
    { wch: 20 }, // Avatar
  ];

  wsMeta['!cols'] = [{ wch: 32 }, { wch: 45 }];
  wsAdmin['!cols'] = [{ wch: 40 }, { wch: 50 }];

  XLSX.utils.book_append_sheet(wb, wsMembers, 'Danh Sách Thành Viên');
  XLSX.utils.book_append_sheet(wb, wsAdmin, 'Tài Khoản Quản Trị');
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Thông Tin Gia Tộc');

  const fileName =
    customFileName ||
    `Gia_Pha_${tree.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Family tree to JSON file
 */
export function exportFamilyTreeToJson(
  tree: FamilyTree,
  customFileName?: string,
  adminCreds: AdminCredentials = DEFAULT_ADMIN_CREDENTIALS
): void {
  const cleanMembers: Record<string, Person> = {};
  const validIds = new Set(Object.keys(tree.members));

  Object.values(tree.members).forEach((m) => {
    if (!m || !m.id) return;
    cleanMembers[m.id] = {
      ...m,
      fatherId: m.fatherId && validIds.has(m.fatherId) ? m.fatherId : null,
      motherId: m.motherId && validIds.has(m.motherId) ? m.motherId : null,
      spouseIds: (m.spouseIds || []).filter((id) => validIds.has(id)),
      childrenIds: (m.childrenIds || []).filter((id) => validIds.has(id)),
    };
  });

  const sanitizedTree: FamilyTree & { adminAccount?: AdminCredentials } = {
    ...tree,
    members: cleanMembers,
    updatedDate: new Date().toISOString(),
    adminAccount: adminCreds,
  };

  const jsonStr = JSON.stringify(sanitizedTree, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    customFileName ||
    `Gia_Pha_Backup_${tree.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to get value from row using multiple possible column aliases
 */
function getRowValue(row: Record<string, any>, possibleKeys: string[]): any {
  // 1. Direct match
  for (const k of possibleKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }

  // 2. Normalized key match
  const rowNormalizedMap: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    rowNormalizedMap[normalizeKey(k)] = row[k];
  });

  for (const k of possibleKeys) {
    const norm = normalizeKey(k);
    if (rowNormalizedMap[norm] !== undefined && rowNormalizedMap[norm] !== null && String(rowNormalizedMap[norm]).trim() !== '') {
      return rowNormalizedMap[norm];
    }
  }

  return undefined;
}

/**
 * Import Family Tree from Excel (.xlsx, .xls)
 * Robustly parses headers, resolves name/ID relations, and builds connected tree.
 */
export async function importFamilyTreeFromExcel(file: File): Promise<FamilyTree> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel không có trang tính (sheet) nào.');
        }

        // Find members sheet
        const sheetName =
          workbook.SheetNames.find(
            (n) =>
              normalizeKey(n).includes('thanhvien') ||
              normalizeKey(n).includes('member') ||
              normalizeKey(n).includes('danhsach')
          ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('Trang tính không có dữ liệu thành viên nào.');
        }

        // Try reading meta sheet if present
        const metaSheetName = workbook.SheetNames.find(
          (n) =>
            normalizeKey(n).includes('thongtin') ||
            normalizeKey(n).includes('meta') ||
            normalizeKey(n).includes('giatoc')
        );

        let treeName = 'Gia Phả Dòng Họ Khôi Phục';
        let treeOrigin = '';
        let treeBranch = 'Chi Trưởng';
        let rootPersonId = '';

        if (metaSheetName) {
          try {
            const metaSheet = workbook.Sheets[metaSheetName];
            const metaData = XLSX.utils.sheet_to_json<Record<string, any>>(metaSheet);
            metaData.forEach((row) => {
              const k = normalizeKey(String(row['Thông tin'] || row['Key'] || row['Mục thông tin'] || ''));
              const val = String(row['Giá trị'] || row['Value'] || '').trim();
              if (k.includes('ten') || k.includes('giapha')) treeName = val || treeName;
              if (k.includes('quequan') || k.includes('nhatho') || k.includes('diachi')) treeOrigin = val;
              if (k.includes('chi') || k.includes('nhanh')) treeBranch = val || treeBranch;
              if (k.includes('thuyto') || k.includes('goc') || k.includes('doi1')) rootPersonId = val;
            });
          } catch {}
        }

        // Step 1: Raw parse all rows and build Name-to-ID and OriginalID-to-CanonicalID mappings
        const rawMembers: Array<{
          id: string;
          fullName: string;
          gender: 'male' | 'female' | 'other';
          birthDate?: string;
          isDeceased: boolean;
          deathDateSolar?: string;
          deathDateLunar?: string;
          restingPlace?: string;
          generation: number;
          birthOrder: number;
          birthOrderTitle?: string;
          branch?: string;
          rawFather: string;
          rawMother: string;
          rawSpouses: string[];
          rawChildren: string[];
          phone?: string;
          email?: string;
          address?: string;
          biography?: string;
          notes?: string;
          avatarUrl?: string;
        }> = [];

        const idMap: Record<string, string> = {}; // originalId -> canonicalId
        const nameMap: Record<string, string> = {}; // normalizedFullName -> canonicalId

        jsonData.forEach((row, idx) => {
          const rawId = getRowValue(row, ['Mã thành viên (ID)', 'ID', 'Mã', 'Mã TV', 'Mã số', 'STT']);
          const rawFullName = getRowValue(row, ['Họ và tên', 'Họ tên', 'FullName', 'Name', 'Tên', 'Họ Tên']);

          // Skip empty rows
          if (!rawFullName && !rawId) return;

          const fullName = String(rawFullName || `Thành viên ${idx + 1}`).trim();
          const canonicalId = rawId ? String(rawId).trim() : `member_${idx + 1}_${Date.now().toString(36)}`;

          idMap[String(rawId || '').trim()] = canonicalId;
          idMap[canonicalId] = canonicalId;
          nameMap[normalizeKey(fullName)] = canonicalId;

          // Gender
          const rawGender = String(getRowValue(row, ['Giới tính (Nam/Nữ)', 'Giới tính', 'Gender', 'Nam/Nữ', 'Phái', 'Sex']) || '').toLowerCase();
          let gender: 'male' | 'female' | 'other' = 'male';
          if (rawGender.includes('nữ') || rawGender.includes('nu') || rawGender.includes('female') || rawGender === 'f' || rawGender.includes('gái')) {
            gender = 'female';
          } else if (rawGender.includes('khác') || rawGender.includes('other')) {
            gender = 'other';
          }

          // Deceased
          const rawDeceased = String(getRowValue(row, ['Tình trạng (Còn sống/Đã mất)', 'Tình trạng', 'Trạng thái', 'Đã mất', 'Status']) || '').toLowerCase();
          const rawDeathLunar = getRowValue(row, ['Ngày giỗ (Âm lịch)', 'Ngày giỗ', 'Giỗ âm', 'Giỗ Âm']);
          const rawDeathSolar = getRowValue(row, ['Ngày giỗ (Dương lịch)', 'Ngày mất', 'Giỗ dương', 'Giỗ Dương']);
          const isDeceased =
            rawDeceased.includes('mất') ||
            rawDeceased.includes('qua đời') ||
            rawDeceased.includes('chết') ||
            Boolean(rawDeathLunar) ||
            Boolean(rawDeathSolar);

          // Split comma list helper
          const parseList = (val: any): string[] => {
            if (!val) return [];
            return String(val)
              .split(/[,;\n]/)
              .map((s) => s.trim())
              .filter(Boolean);
          };

          const rawFather = String(getRowValue(row, ['Mã Cha (Bố)', 'Mã Cha', 'Mã Bố', 'Cha', 'Bố', 'Father', 'FatherId', 'ID Cha']) || '').trim();
          const rawMother = String(getRowValue(row, ['Mã Mẹ', 'Mẹ', 'Mother', 'MotherId', 'ID Mẹ']) || '').trim();
          const rawSpouses = parseList(getRowValue(row, ['Mã Vợ/Chồng (cách nhau dấu phẩy)', 'Vợ/Chồng', 'Vợ', 'Chồng', 'Spouse', 'Spouses', 'Mã Vợ/Chồng']));
          const rawChildren = parseList(getRowValue(row, ['Mã Con cái (cách nhau dấu phẩy)', 'Con cái', 'Con', 'Children', 'Mã Con']));

          const genVal = Number(getRowValue(row, ['Thế hệ (Đời)', 'Đời', 'Thế hệ', 'Đời thứ', 'Generation', 'Gen']));
          const generation = !isNaN(genVal) && genVal > 0 ? genVal : 1;

          const orderVal = Number(getRowValue(row, ['Thứ tự sinh', 'Thứ tự', 'Thứ', 'Con thứ', 'BirthOrder', 'Order']));
          const birthOrder = !isNaN(orderVal) && orderVal > 0 ? orderVal : 1;

          rawMembers.push({
            id: canonicalId,
            fullName,
            gender,
            birthDate: parseExcelDate(getRowValue(row, ['Ngày sinh', 'Năm sinh', 'Sinh', 'BirthDate', 'Birth', 'DOB'])),
            isDeceased,
            deathDateSolar: parseExcelDate(rawDeathSolar),
            deathDateLunar: rawDeathLunar ? String(rawDeathLunar).trim() : undefined,
            restingPlace: getRowValue(row, ['Nơi an nghỉ (Mộ phần)', 'Nơi an nghỉ', 'Mộ phần', 'Nơi an táng', 'Mộ']) ? String(getRowValue(row, ['Nơi an nghỉ (Mộ phần)', 'Nơi an nghỉ', 'Mộ phần', 'Nơi an táng', 'Mộ'])).trim() : undefined,
            generation,
            birthOrder,
            birthOrderTitle: getRowValue(row, ['Danh xưng thứ tự', 'Danh xưng', 'Thứ bậc', 'Vai vế']) ? String(getRowValue(row, ['Danh xưng thứ tự', 'Danh xưng', 'Thứ bậc', 'Vai vế'])).trim() : undefined,
            branch: getRowValue(row, ['Chi/Nhánh họ', 'Chi họ', 'Chi', 'Nhánh', 'Branch']) ? String(getRowValue(row, ['Chi/Nhánh họ', 'Chi họ', 'Chi', 'Nhánh', 'Branch'])).trim() : treeBranch,
            rawFather,
            rawMother,
            rawSpouses,
            rawChildren,
            phone: getRowValue(row, ['Số điện thoại', 'SĐT', 'Điện thoại', 'Phone']) ? String(getRowValue(row, ['Số điện thoại', 'SĐT', 'Điện thoại', 'Phone'])).trim() : undefined,
            email: getRowValue(row, ['Email', 'Thư điện tử']) ? String(getRowValue(row, ['Email', 'Thư điện tử'])).trim() : undefined,
            address: getRowValue(row, ['Địa chỉ', 'Nơi ở', 'Address']) ? String(getRowValue(row, ['Địa chỉ', 'Nơi ở', 'Address'])).trim() : undefined,
            biography: getRowValue(row, ['Tiểu sử / Sự nghiệp', 'Tiểu sử', 'Sự nghiệp', 'Biography']) ? String(getRowValue(row, ['Tiểu sử / Sự nghiệp', 'Tiểu sử', 'Sự nghiệp', 'Biography'])).trim() : undefined,
            notes: getRowValue(row, ['Ghi chú', 'Ghi chú thêm', 'Notes']) ? String(getRowValue(row, ['Ghi chú', 'Ghi chú thêm', 'Notes'])).trim() : undefined,
            avatarUrl: getRowValue(row, ['Link ảnh', 'Ảnh', 'Avatar', 'AvatarUrl']) ? String(getRowValue(row, ['Link ảnh', 'Ảnh', 'Avatar', 'AvatarUrl'])).trim() : undefined,
          });
        });

        if (rawMembers.length === 0) {
          throw new Error('Không trích xuất được thành viên nào từ file Excel.');
        }

        // Helper to resolve string to Person ID
        const resolvePersonId = (target: string): string | null => {
          if (!target) return null;
          const trimmed = target.trim();
          if (idMap[trimmed]) return idMap[trimmed];
          const norm = normalizeKey(trimmed);
          if (nameMap[norm]) return nameMap[norm];
          return null;
        };

        // Step 2: Build connected Person dictionary
        const members: Record<string, Person> = {};

        rawMembers.forEach((raw) => {
          const fatherId = resolvePersonId(raw.rawFather);
          const motherId = resolvePersonId(raw.rawMother);
          const spouseIds = raw.rawSpouses.map(resolvePersonId).filter((id): id is string => Boolean(id) && id !== raw.id);
          const childrenIds = raw.rawChildren.map(resolvePersonId).filter((id): id is string => Boolean(id) && id !== raw.id);

          members[raw.id] = {
            id: raw.id,
            fullName: raw.fullName,
            gender: raw.gender,
            birthDate: raw.birthDate || undefined,
            isDeceased: raw.isDeceased,
            deathDateSolar: raw.deathDateSolar || undefined,
            deathDateLunar: raw.deathDateLunar || undefined,
            restingPlace: raw.restingPlace || undefined,
            generation: raw.generation || 1,
            birthOrder: raw.birthOrder || 1,
            birthOrderTitle: raw.birthOrderTitle || undefined,
            branch: raw.branch || treeBranch,
            fatherId: fatherId || null,
            motherId: motherId || null,
            spouseIds: Array.from(new Set(spouseIds)),
            childrenIds: Array.from(new Set(childrenIds)),
            phone: raw.phone || undefined,
            email: raw.email || undefined,
            address: raw.address || undefined,
            biography: raw.biography || undefined,
            notes: raw.notes || undefined,
            avatarUrl: raw.avatarUrl || undefined,
          };
        });

        // Step 3: Bi-directional link stabilization
        Object.values(members).forEach((person) => {
          // If person has father, add person to father's children
          if (person.fatherId && members[person.fatherId]) {
            if (!members[person.fatherId].childrenIds.includes(person.id)) {
              members[person.fatherId].childrenIds.push(person.id);
            }
          }
          // If person has mother, add person to mother's children
          if (person.motherId && members[person.motherId]) {
            if (!members[person.motherId].childrenIds.includes(person.id)) {
              members[person.motherId].childrenIds.push(person.id);
            }
          }
          // If parent has children, link child to parent
          person.childrenIds.forEach((cId) => {
            if (members[cId]) {
              if (person.gender === 'male' && !members[cId].fatherId) {
                members[cId].fatherId = person.id;
              } else if (person.gender === 'female' && !members[cId].motherId) {
                members[cId].motherId = person.id;
              }
            }
          });
          // Spouses bi-directional link
          person.spouseIds.forEach((sId) => {
            if (members[sId] && !members[sId].spouseIds.includes(person.id)) {
              members[sId].spouseIds.push(person.id);
            }
          });
        });

        // Step 4: Generation calculation if missing/uniform
        const allGenerationsEqual = Object.values(members).every((m) => m.generation === 1);
        if (allGenerationsEqual && Object.values(members).some((m) => (m.childrenIds || []).length > 0)) {
          // Compute generation dynamically by graph depth
          const visitedGen = new Set<string>();
          const assignGen = (personId: string, gen: number) => {
            if (visitedGen.has(personId) || !members[personId]) return;
            visitedGen.add(personId);
            members[personId].generation = gen;
            // Spouses same generation
            members[personId].spouseIds.forEach((sId) => {
              if (members[sId]) members[sId].generation = gen;
            });
            // Children generation + 1
            members[personId].childrenIds.forEach((cId) => {
              assignGen(cId, gen + 1);
            });
          };

          // Find top roots
          const roots = Object.values(members).filter((m) => !m.fatherId && !m.motherId);
          roots.forEach((r) => assignGen(r.id, 1));
        }

        // Step 5: Determine valid rootPersonId
        const memberList = Object.values(members);
        if (!rootPersonId || !members[rootPersonId]) {
          // Priority 1: Top person with generation 1 who has children
          const gen1WithChildren = memberList.filter((m) => m.generation === 1 && m.childrenIds.length > 0);
          if (gen1WithChildren.length > 0) {
            rootPersonId = gen1WithChildren[0].id;
          } else {
            // Priority 2: Anyone with generation 1
            const gen1 = memberList.filter((m) => m.generation === 1);
            if (gen1.length > 0) {
              rootPersonId = gen1[0].id;
            } else {
              // Priority 3: First member in list
              rootPersonId = memberList[0].id;
            }
          }
        }

        const importedTree: FamilyTree = {
          id: `tree_${Date.now()}`,
          name: treeName,
          branchName: treeBranch,
          origin: treeOrigin,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          rootPersonId,
          members,
        };

        resolve(importedTree);
      } catch (err: any) {
        reject(new Error(`Lỗi đọc file Excel: ${err.message || 'Định dạng không hợp lệ'}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file đã chọn.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import Family Tree from JSON file
 */
export async function importFamilyTreeFromJson(file: File): Promise<FamilyTree> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.members || typeof parsed.members !== 'object') {
          throw new Error('Dữ liệu JSON không chứa danh sách thành viên gia phả hợp lệ.');
        }

        const memberKeys = Object.keys(parsed.members);
        if (memberKeys.length === 0) {
          throw new Error('Danh sách thành viên trong file JSON rỗng.');
        }

        const cleanMembers: Record<string, Person> = {};
        const validIds = new Set(memberKeys);

        memberKeys.forEach((id) => {
          const m = parsed.members[id];
          if (!m || !m.fullName) return;
          cleanMembers[id] = {
            id,
            fullName: String(m.fullName).trim(),
            gender: m.gender === 'female' ? 'female' : m.gender === 'other' ? 'other' : 'male',
            birthDate: m.birthDate ? String(m.birthDate).trim() : undefined,
            isDeceased: Boolean(m.isDeceased),
            deathDateSolar: m.deathDateSolar ? String(m.deathDateSolar).trim() : undefined,
            deathDateLunar: m.deathDateLunar ? String(m.deathDateLunar).trim() : undefined,
            restingPlace: m.restingPlace ? String(m.restingPlace).trim() : undefined,
            generation: Number(m.generation) || 1,
            birthOrder: Number(m.birthOrder) || 1,
            birthOrderTitle: m.birthOrderTitle ? String(m.birthOrderTitle).trim() : undefined,
            branch: m.branch ? String(m.branch).trim() : parsed.branchName || 'Chi Trưởng',
            fatherId: m.fatherId && validIds.has(m.fatherId) ? m.fatherId : null,
            motherId: m.motherId && validIds.has(m.motherId) ? m.motherId : null,
            spouseIds: (Array.isArray(m.spouseIds) ? m.spouseIds : []).filter((sId: string) => validIds.has(sId) && sId !== id),
            childrenIds: (Array.isArray(m.childrenIds) ? m.childrenIds : []).filter((cId: string) => validIds.has(cId) && cId !== id),
            phone: m.phone ? String(m.phone).trim() : undefined,
            email: m.email ? String(m.email).trim() : undefined,
            address: m.address ? String(m.address).trim() : undefined,
            biography: m.biography ? String(m.biography).trim() : undefined,
            notes: m.notes ? String(m.notes).trim() : undefined,
            avatarUrl: m.avatarUrl ? String(m.avatarUrl).trim() : undefined,
          };
        });

        let rootPersonId = parsed.rootPersonId;
        if (!validIds.has(rootPersonId)) {
          const gen1 = Object.values(cleanMembers).find((m) => m.generation === 1);
          rootPersonId = gen1 ? gen1.id : memberKeys[0];
        }

        const importedTree: FamilyTree = {
          id: `tree_${Date.now()}`,
          name: parsed.name || 'Gia Phả Dòng Họ',
          branchName: parsed.branchName || 'Chi Trưởng',
          origin: parsed.origin || '',
          createdDate: parsed.createdDate || new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          rootPersonId,
          members: cleanMembers,
        };

        resolve(importedTree);
      } catch (err: any) {
        reject(new Error(`Lỗi phân tích cú pháp JSON: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file JSON đã chọn.'));
    reader.readAsText(file);
  });
}
