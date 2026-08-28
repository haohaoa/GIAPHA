/**
 * Vietnamese Lunar Calendar & Death Anniversary (Ngày Giỗ) Utilities
 * Accurate Vietnamese Lunar Calendar calculations (Timezone GMT+7)
 */

// Can Chi Names
export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export const LUNAR_MONTH_NAMES = [
  'Tháng Giêng (1)',
  'Tháng Hai (2)',
  'Tháng Ba (3)',
  'Tháng Tư (4)',
  'Tháng Năm (5)',
  'Tháng Sáu (6)',
  'Tháng Bảy (7)',
  'Tháng Tám (8)',
  'Tháng Chín (9)',
  'Tháng Mười (10)',
  'Tháng Mười Một (11)',
  'Tháng Chạp (12)',
];

export function getCanChiYear(year: number): string {
  if (!year || isNaN(year)) return '';
  const canIndex = (year + 6) % 10;
  const chiIndex = (year + 8) % 12;
  return `${CAN[(canIndex + 10) % 10]} ${CHI[(chiIndex + 12) % 12]}`;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return dateStr;
}

// Astronomical calculation for Julian Day Number
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a, b, c, d, e, m, day, month, year;
  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + alpha - Math.floor(alpha / 4);
  } else {
    a = jd;
  }
  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  day = Math.floor(b - d - Math.floor(30.6001 * e));
  month = e < 14 ? e - 1 : e - 13;
  year = month > 2 ? c - 4716 : c - 4715;
  return { day, month, year };
}

function getNewMoonDay(k: number, timeZone = 7): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  const C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  const C2 = -0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  const C3 = -0.0004 * Math.sin(3 * dr * Mpr);
  const C4 = 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  const C5 = -0.004 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  const C6 = -0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  const C7 = 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((M + 2 * Mpr) * dr);
  const deltat = 0;
  const JdNew = Jd1 + C1 + C2 + C3 + C4 + C5 + C6 + C7 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone = 7): number {
  const T = (jdn - 2451545.0 + 0.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone = 7): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
  canChiYear: string;
}

/**
 * Convert standard Solar Date to accurate Vietnamese Lunar Date
 */
export function convertSolarToLunar(dd: number, mm: number, yy: number, timeZone = 7): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear = yy;
  if (a11 >= monthStart) {
    lunarYear = yy - 1;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let isLeap = false;
  if (b11 - a11 > 365) {
    let leapMonthDiff = 0;
    let lastSunLong = getSunLongitude(a11, timeZone);
    for (let i = 0; i < 13; i++) {
      const nm = getNewMoonDay(Math.floor((a11 - 2415021.076998695) / 29.530588853) + i + 1, timeZone);
      const sunLong = getSunLongitude(nm, timeZone);
      if (sunLong === lastSunLong) {
        leapMonthDiff = i;
        break;
      }
      lastSunLong = sunLong;
    }
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        isLeap = true;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeap,
    canChiYear: getCanChiYear(lunarYear),
  };
}

/**
 * Standard date string converter (e.g. "1975-08-20" -> "14 tháng 7 (năm Ất Mão)")
 */
export function convertSolarToLunarEstimate(solarDateStr: string): string {
  if (!solarDateStr) return '';
  const match = solarDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return solarDateStr;

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);

  try {
    const lunar = convertSolarToLunar(d, m, y);
    return `${lunar.day} tháng ${lunar.month} Âm lịch (năm ${lunar.canChiYear})`;
  } catch {
    return `${d}/${m} Âm lịch`;
  }
}

/**
 * Parses any user-entered lunar string to { day, month }
 * Examples: "15/07", "15/7", "15 tháng 7", "15-7", "Mùng 1 tháng 8", "15 tháng Chạp", "15 tháng Giêng"
 */
export function parseLunarDayMonth(lunarStr?: string): { day: number; month: number } | null {
  if (!lunarStr) return null;
  const str = lunarStr.toLowerCase().trim();

  // Special named months
  let processedStr = str
    .replace(/tháng giêng/g, 'tháng 1')
    .replace(/tháng chạp/g, 'tháng 12')
    .replace(/mùng\s*/g, '');

  const regex1 = /(\d{1,2})\s*[/.-]\s*(\d{1,2})/;
  const m1 = processedStr.match(regex1);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const month = parseInt(m1[2], 10);
    if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }

  const regex2 = /(\d{1,2})\s*tháng\s*(\d{1,2})/i;
  const m2 = processedStr.match(regex2);
  if (m2) {
    const day = parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10);
    if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }

  return null;
}

export interface DeathAnniversaryMatch {
  personId: string;
  fullName: string;
  generation: number;
  isLunar: boolean;
  day: number;
  month: number;
  displayDate: string;
  restingPlace?: string;
  notes?: string;
}

