export interface ShoppingItem {
  name: string;
  store?: string;
  checked: boolean;
  links?: { title: string; url: string }[];
}

export interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}
