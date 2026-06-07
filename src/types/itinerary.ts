import type { ThemeColor } from '../utils/colors';

export type ActivityType = 'flight' | 'car' | 'train' | 'bus' | 'ship' | 'food' | 'spot' | 'hotel' | 'home' | 'coffee';

export interface Activity {
  time: string;              // 例如 "09:00" 或 "上午"
  title: string;             // 景點名稱
  description?: string;      // 備註說明（可選，支援 \n 換行）
  isKidFriendly: boolean;    // 適合幼兒
  isSeniorFriendly: boolean; // 適合長輩
  activityType?: ActivityType; // 活動類型圖示（可選）
  mapQuery?: string;         // Google Maps 搜尋字串（可選）
  mapUrl?: string;           // Google Maps 分享連結（可選）
  photoUrl?: string;         // 景點照片 URL（可選）
  priority?: 'must' | 'normal' | 'optional'; // 優先度（可選）
  links?: { title: string; url: string }[]; // 參考連結（可選）
}

export interface Transport {
  mode: 'taxi' | 'car' | 'train' | 'bus' | 'walk' | 'public'; // 交通方式
  description: string;       // 例如 "自駕約40分鐘"
  icon: string;              // 對應 lucide-react 圖示名稱
}

export interface Attachment {
  type: 'pdf' | 'image';
  url: string;
  label?: string;
}

export interface Ticket {
  name: string;
  type: 'flight' | 'train' | 'metro' | 'bus' | 'restaurant';
  datetime?: string;
  notes?: string;
  attachments?: Attachment[];
}

export interface Accommodation {
  name: string;              // 住宿名稱或區域
  description?: string;      // 備註
  mapQuery?: string;         // Google Maps 搜尋字串
  photoUrl?: string;         // 住宿照片 URL（可選）
  attachments?: Attachment[];// 住宿附件（訂房確認、地圖等）
  links?: { title: string; url: string }[]; // 參考連結（可選）
}

export interface DayPlan {
  day: number;               // 第幾天
  date?: string;             // 實際日期（可選，之後再填）
  title: string;             // 當日標題，例如 "熊本 → 阿蘇"
  themeColor: ThemeColor;    // 當日主題色
  isTravelDay?: boolean;     // 移動日（含飛機/跨城市）
  activities: Activity[];
  transport: Transport;
  accommodation?: Accommodation; // 最後一天無住宿
  tickets?: Ticket[];        // 當日交通票券
}

export type Itinerary = DayPlan[];
