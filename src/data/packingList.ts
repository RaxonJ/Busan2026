import type { PackingItem } from '../types/packingList';
export type { PackingItem };

export const packingList: PackingItem[] = [
  // 證件類
  { id: 'doc-1', category: '證件', item: '護照（所有人）' },
  { id: 'doc-2', category: '證件', item: '機票電子檔' },
  { id: 'doc-3', category: '證件', item: '飯店預訂確認信' },
  { id: 'doc-4', category: '證件', item: '旅遊保險單' },
  { id: 'doc-5', category: '證件', item: '信用卡 x2' },
  { id: 'doc-6', category: '證件', item: '韓幣現金' },
  { id: 'doc-7', category: '證件', item: '釜山PASS（確認活動兌換）' },

  // 汗蒸幕 / 水上活動
  { id: 'spa-1', category: '汗蒸幕／溫泉', item: '泳衣（Club D Oasis 水上樂園備用）' },
  { id: 'spa-2', category: '汗蒸幕／溫泉', item: '防水袋' },
  { id: 'spa-3', category: '汗蒸幕／溫泉', item: '夾腳拖（館內走動）' },

  // 衣物
  { id: 'cloth-1', category: '衣物', item: '換洗衣物（5 天份）' },
  { id: 'cloth-2', category: '衣物', item: '薄外套（9 月釜山早晚溫差）' },
  { id: 'cloth-3', category: '衣物', item: '舒適步行鞋' },
  { id: 'cloth-4', category: '衣物', item: '折疊雨傘' },

  // 通用物品
  { id: 'general-1', category: '通用', item: '充電線 + 行動電源' },
  { id: 'general-2', category: '通用', item: '轉接插頭（韓國 Type C）' },
  { id: 'general-3', category: '通用', item: '防曬乳' },
  { id: 'general-4', category: '通用', item: '個人盥洗用品' },
  { id: 'general-5', category: '通用', item: '塑膠袋（裝髒衣服）' },
  { id: 'general-6', category: '通用', item: '相機 / 記憶卡' },
  { id: 'general-7', category: '通用', item: '口罩（飛機用）' },
  { id: 'general-8', category: '通用', item: '暈車藥' },
  { id: 'general-9', category: '通用', item: '韓文翻譯 App（Papago）' },
];
