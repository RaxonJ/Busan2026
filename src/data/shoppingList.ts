import type { ShoppingItem, ShoppingCategory } from '../types/shoppingList';
export type { ShoppingItem, ShoppingCategory };

export const shoppingList: ShoppingCategory[] = [
  {
    category: '藥妝店必買',
    items: [
      { name: '韓國面膜（Mediheal / Dr.Jart）', checked: false },
      { name: '魚油護膚品（海洋深層保濕）', checked: false },
      { name: '韓國防曬（Etude / COSRX）', checked: false },
      { name: '正官庄紅蔘精華', checked: false },
      { name: '消化藥（케베라 / 소화제）', checked: false },
      { name: '暈車藥（키미테）', checked: false },
    ],
  },
  {
    category: '零食伴手禮',
    items: [
      { name: '海苔（東遠 / CJ 原味大包）', checked: false },
      { name: '辣炒年糕醬包', checked: false },
      { name: '蜂蜜奶油薯片（허니버터칩）', checked: false },
      { name: '高麗人蔘糖', checked: false },
      { name: '釜山魚板禮盒', checked: false },
      { name: '海雲台鹽味焦糖餅', checked: false },
    ],
  },
  {
    category: '生活雜貨',
    items: [
      { name: '韓國棉質浴巾（大創 / DAISO 韓版）', checked: false },
      { name: '韓國文具 / 圖案貼紙', checked: false },
      { name: '摺疊購物袋', checked: false },
      { name: '韓國零食禮盒（給朋友）', checked: false },
    ],
  },
  {
    category: '機장（機張）特產',
    items: [
      { name: '機張大閘蟹醬（간장게장）醬料包', checked: false },
      { name: '機張鮑魚乾', checked: false },
    ],
  },
];
