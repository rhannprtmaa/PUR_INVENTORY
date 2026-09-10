export type UserRole = 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdByUid?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Souvenir {
  id: string;
  categoryId: string;
  name: string;
  unit: string; // e.g. 'pcs', 'box', 'rim', 'set', 'paket', 'buah'
  minimumStock: number;
  description?: string;
  createdByUid?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  pic: string;
  activityDate: string; // YYYY-MM-DD
  location: string;
  description: string;
  createdByUid?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryIn {
  id: string;
  souvenirId: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  description: string;
  createdBy?: string;
  createdByUid?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryOutItem {
  id: string;
  inventoryOutId: string;
  souvenirId: string;
  quantity: number;
  description?: string;
  createdAt: string;
}

export interface InventoryOut {
  id: string;
  activityId: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdBy?: string;
  createdByUid?: string;
  createdByName?: string;
  items?: InventoryOutItem[];
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'Aman' | 'Menipis' | 'Habis';

export interface SouvenirStockSummary {
  souvenir: Souvenir;
  categoryName: string;
  category?: Category;
  totalIn: number;
  totalOut: number;
  currentStock: number;
  status: StockStatus;
}

export type StockSummary = SouvenirStockSummary;

export interface TransactionHistoryItem {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  souvenirId: string;
  souvenirName: string;
  categoryName: string;
  quantity: number;
  unit: string;
  activityId?: string;
  activityName?: string;
  user: string;
  description: string;
  createdAt: string;
  originalTxId: string;
  subItemId?: string;
}

export interface ReportingRecord {
  activityId: string;
  activityName: string;
  pic: string;
  activityDate: string;
  location: string;
  items: {
    souvenirId: string;
    souvenirName: string;
    categoryName: string;
    quantity: number;
    unit: string;
    description?: string;
  }[];
  totalItems: number;
  inventoryOutIds: string[];
}
