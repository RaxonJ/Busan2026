/**
 * 緊急聯絡資訊
 *
 * 資料來源：src/config/trip.ts（tripConfig.emergencyContacts）
 * 換旅遊目的地時，請在 trip.ts 中更新，此處無需修改。
 */
import { tripConfig } from '../config/trip';

export type { EmergencyContact } from '../config/trip';

export const emergencyContacts = tripConfig.emergencyContacts;
