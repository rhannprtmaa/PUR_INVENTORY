import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Category,
  InventoryIn,
  InventoryOut,
  InventoryOutItem,
  ReportingRecord,
  Souvenir,
  SouvenirStockSummary,
  StockStatus,
  TransactionHistoryItem,
  User,
} from '../types';
import {
  INITIAL_ACTIVITIES,
  INITIAL_CATEGORIES,
  INITIAL_INVENTORY_IN,
  INITIAL_INVENTORY_OUT,
  INITIAL_INVENTORY_OUT_ITEMS,
  INITIAL_SOUVENIRS,
  INITIAL_USERS,
} from '../data/seedData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface InventoryContextType {
  // State
  users: User[];
  currentUser: User;
  categories: Category[];
  souvenirs: Souvenir[];
  activities: Activity[];
  inventoryIn: InventoryIn[];
  inventoryOut: InventoryOut[];
  inventoryOutItems: InventoryOutItem[];
  toasts: Toast[];

  // Auth / Role
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
  updateProfile: (data: { name?: string; email?: string; avatar?: string; department?: string }) => { success: boolean; message?: string };
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message?: string };

  // Categories CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteCategory: (id: string) => { success: boolean; message?: string };

  // Souvenirs CRUD
  addSouvenir: (data: Omit<Souvenir, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; id?: string };
  updateSouvenir: (id: string, data: Partial<Omit<Souvenir, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteSouvenir: (id: string) => { success: boolean; message?: string };

  // Activities CRUD
  addActivity: (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; id?: string };
  updateActivity: (id: string, data: Partial<Omit<Activity, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteActivity: (id: string) => { success: boolean; message?: string };

  // Inventory In CRUD
  addInventoryIn: (data: Omit<InventoryIn, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateInventoryIn: (id: string, data: Partial<Omit<InventoryIn, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteInventoryIn: (id: string) => { success: boolean; message?: string };

  // Inventory Out CRUD
  addInventoryOut: (
    data: Omit<InventoryOut, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
    items: { souvenirId: string; quantity: number; description?: string }[]
  ) => { success: boolean; message?: string };
  updateInventoryOut: (
    id: string,
    data: Partial<Omit<InventoryOut, 'id' | 'createdAt' | 'items'>>,
    items?: { id?: string; souvenirId: string; quantity: number; description?: string }[]
  ) => { success: boolean; message?: string };
  deleteInventoryOut: (id: string) => { success: boolean; message?: string };

  // Stock calculations & helpers
  getSouvenirStock: (souvenirId: string, excludeOutId?: string, excludeInId?: string) => {
    totalIn: number;
    totalOut: number;
    currentStock: number;
    status: StockStatus;
  };
  validateStockAvailability: (
    souvenirId: string,
    requestedQty: number,
    excludeOutId?: string
  ) => { valid: boolean; availableStock: number; souvenirName: string; message?: string };

  // Derived datasets
  stockSummaries: SouvenirStockSummary[];
  transactionHistory: TransactionHistoryItem[];
  reportingRecords: ReportingRecord[];

  // UI Utilities
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  resetToInitialData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'souvenir_users_v1',
  CURRENT_USER_ID: 'souvenir_current_user_id_v1',
  CATEGORIES: 'souvenir_categories_v1',
  SOUVENIRS: 'souvenir_souvenirs_v1',
  ACTIVITIES: 'souvenir_activities_v1',
  INVENTORY_IN: 'souvenir_inventory_in_v1',
  INVENTORY_OUT: 'souvenir_inventory_out_v1',
  INVENTORY_OUT_ITEMS: 'souvenir_inventory_out_items_v1',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or seed
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (
          parsed.some((u) => u.email === 'purinventorybi@gmail.com') &&
          parsed.length === 1 &&
          parsed[0].avatar === '/logo-bi.png'
        ) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return INITIAL_USERS[0].id;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [souvenirs, setSouvenirs] = useState<Souvenir[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUVENIRS);
    return saved ? JSON.parse(saved) : INITIAL_SOUVENIRS;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [inventoryIn, setInventoryIn] = useState<InventoryIn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY_IN);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_IN;
  });

  const [inventoryOut, setInventoryOut] = useState<InventoryOut[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY_OUT);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_OUT;
  });

  const [inventoryOutItems, setInventoryOutItems] = useState<InventoryOutItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY_OUT_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_OUT_ITEMS;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUVENIRS, JSON.stringify(souvenirs));
  }, [souvenirs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_IN, JSON.stringify(inventoryIn));
  }, [inventoryIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_OUT, JSON.stringify(inventoryOut));
  }, [inventoryOut]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_OUT_ITEMS, JSON.stringify(inventoryOutItems));
  }, [inventoryOutItems]);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('pur_is_authenticated_v1');
    return saved !== null ? saved === 'true' : false;
  });

  const login = (email: string, _password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail || u.name.toLowerCase().includes(normalizedEmail)
    ) || users[0];

    setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    localStorage.setItem('pur_is_authenticated_v1', 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matchedUser.id);
    addToast(`Selamat datang kembali di PUR INVENTORY, ${matchedUser.name}!`, 'success');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('pur_is_authenticated_v1', 'false');
    addToast('Anda telah keluar dari sistem.', 'info');
  };

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const isAdmin = currentUser.role === 'admin';

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      addToast(`Beralih akun ke ${user.name} (${user.role.toUpperCase()})`, 'info');
    }
  };

  const updateProfile = (data: { name?: string; email?: string; avatar?: string; department?: string }) => {
    setUsers((prevUsers) => {
      const next = prevUsers.map((u) => {
        if (u.id === currentUserId) {
          return {
            ...u,
            name: data.name !== undefined && data.name.trim() !== '' ? data.name.trim() : u.name,
            email: data.email !== undefined && data.email.trim() !== '' ? data.email.trim() : u.email,
            avatar: data.avatar !== undefined ? data.avatar : u.avatar,
            department: data.department !== undefined ? data.department.trim() : u.department,
          };
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      return next;
    });
    addToast('Profil pengguna berhasil disimpan.', 'success');
    return { success: true };
  };

  const changePassword = (oldPassword: string, newPassword: string) => {
    const currentPass = localStorage.getItem('pur_user_password_v1') || 'admin123';
    // If oldPassword given and not matching
    if (oldPassword && oldPassword !== currentPass && oldPassword !== '••••••••' && oldPassword !== 'admin123') {
      addToast('Kata sandi saat ini tidak sesuai.', 'error');
      return { success: false, message: 'Kata sandi saat ini tidak sesuai.' };
    }
    if (!newPassword || newPassword.length < 5) {
      addToast('Kata sandi baru minimal 5 karakter.', 'error');
      return { success: false, message: 'Kata sandi baru minimal 5 karakter.' };
    }
    localStorage.setItem('pur_user_password_v1', newPassword);
    addToast('Kata sandi berhasil diperbarui.', 'success');
    return { success: true };
  };

  // Stock calculation engine
  const getSouvenirStock = (souvenirId: string, excludeOutId?: string, excludeInId?: string) => {
    const souv = souvenirs.find((s) => s.id === souvenirId);
    const minStock = souv ? souv.minimumStock : 10;

    // Total In
    const totalIn = inventoryIn
      .filter((item) => item.souvenirId === souvenirId && (!excludeInId || item.id !== excludeInId))
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // Total Out
    const totalOut = inventoryOutItems
      .filter((item) => {
        if (item.souvenirId !== souvenirId) return false;
        if (excludeOutId && item.inventoryOutId === excludeOutId) return false;
        return true;
      })
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const currentStock = Math.max(0, totalIn - totalOut);

    let status: StockStatus = 'Aman';
    if (currentStock <= 0) {
      status = 'Habis';
    } else if (currentStock <= minStock) {
      status = 'Menipis';
    } else {
      status = 'Aman';
    }

    return { totalIn, totalOut, currentStock, status };
  };

  // Validates if requested quantity can be discharged
  const validateStockAvailability = (
    souvenirId: string,
    requestedQty: number,
    excludeOutId?: string
  ) => {
    const souv = souvenirs.find((s) => s.id === souvenirId);
    const souvenirName = souv ? souv.name : 'Barang';
    const { currentStock } = getSouvenirStock(souvenirId, excludeOutId);

    if (requestedQty <= 0) {
      return {
        valid: false,
        availableStock: currentStock,
        souvenirName,
        message: 'Jumlah barang keluar harus lebih besar dari 0.',
      };
    }

    if (requestedQty > currentStock) {
      return {
        valid: false,
        availableStock: currentStock,
        souvenirName,
        message: `Stok tidak mencukupi untuk "${souvenirName}". Stok tersedia hanya ${currentStock} ${souv?.unit || 'item'}.`,
      };
    }

    return { valid: true, availableStock: currentStock, souvenirName };
  };

  // Categories CRUD
  const addCategory = (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name.trim()) {
      return { success: false, message: 'Nama kategori wajib diisi.' };
    }
    const exists = categories.some((c) => c.name.toLowerCase() === data.name.trim().toLowerCase());
    if (exists) {
      return { success: false, message: 'Kategori dengan nama tersebut sudah ada.' };
    }

    const now = new Date().toISOString();
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    setCategories((prev) => [newCategory, ...prev]);
    addToast('Kategori berhasil ditambahkan.');
    return { success: true };
  };

  const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: 'Nama kategori wajib diisi.' };
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...(data.name !== undefined ? { name: data.name.trim() } : {}),
              ...(data.description !== undefined ? { description: data.description.trim() } : {}),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    addToast('Data kategori berhasil diperbarui.');
    return { success: true };
  };

  const deleteCategory = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus data kategori.' };
    }

    // Safely remove category
    setCategories((prev) => prev.filter((c) => c.id !== id));

    // Safely unlink or clean category association from souvenirs
    setSouvenirs((prev) =>
      prev.map((s) => (s.categoryId === id ? { ...s, categoryId: '' } : s))
    );

    // Safely unlink from inventory in records
    setInventoryIn((prev) =>
      prev.map((item) => (item.categoryId === id ? { ...item, categoryId: '' } : item))
    );

    addToast('Data kategori berhasil dihapus.', 'success');
    return { success: true };
  };

  // Souvenirs CRUD
  const addSouvenir = (data: Omit<Souvenir, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name.trim()) {
      return { success: false, message: 'Nama barang wajib diisi.' };
    }
    if (!data.categoryId) {
      return { success: false, message: 'Kategori wajib dipilih.' };
    }
    if (data.minimumStock === undefined || data.minimumStock < 0) {
      return { success: false, message: 'Stok minimum harus berupa angka 0 atau lebih.' };
    }

    const now = new Date().toISOString();
    const newSouvenir: Souvenir = {
      id: `souv-${Date.now()}`,
      categoryId: data.categoryId,
      name: data.name.trim(),
      unit: data.unit || 'pcs',
      minimumStock: Number(data.minimumStock) || 0,
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    setSouvenirs((prev) => [newSouvenir, ...prev]);
    addToast('Data souvenir berhasil ditambahkan.');
    return { success: true, id: newSouvenir.id };
  };

  const updateSouvenir = (id: string, data: Partial<Omit<Souvenir, 'id' | 'createdAt'>>) => {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: 'Nama barang wajib diisi.' };
    }

    setSouvenirs((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...data,
              minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : s.minimumStock,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
    addToast('Data souvenir berhasil diperbarui.');
    return { success: true };
  };

  const deleteSouvenir = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus souvenir.' };
    }
    const hasIn = inventoryIn.some((i) => i.souvenirId === id);
    const hasOut = inventoryOutItems.some((i) => i.souvenirId === id);
    if (hasIn || hasOut) {
      return {
        success: false,
        message: 'Souvenir tidak dapat dihapus karena sudah memiliki riwayat transaksi inventory.',
      };
    }

    setSouvenirs((prev) => prev.filter((s) => s.id !== id));
    addToast('Data souvenir berhasil dihapus.');
    return { success: true };
  };

  // Activities CRUD
  const addActivity = (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name.trim()) {
      return { success: false, message: 'Nama kegiatan wajib diisi.' };
    }
    if (!data.pic.trim()) {
      return { success: false, message: 'PIC kegiatan wajib diisi.' };
    }
    if (!data.activityDate) {
      return { success: false, message: 'Tanggal kegiatan wajib diisi.' };
    }

    const now = new Date().toISOString();
    const newId = `act-${Date.now()}`;
    const newActivity: Activity = {
      id: newId,
      name: data.name.trim(),
      pic: data.pic.trim(),
      activityDate: data.activityDate,
      location: data.location?.trim() || '-',
      description: data.description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    setActivities((prev) => [newActivity, ...prev]);
    addToast('Kegiatan berhasil ditambahkan.');
    return { success: true, id: newId };
  };

  const updateActivity = (id: string, data: Partial<Omit<Activity, 'id' | 'createdAt'>>) => {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: 'Nama kegiatan wajib diisi.' };
    }
    if (data.pic !== undefined && !data.pic.trim()) {
      return { success: false, message: 'PIC kegiatan wajib diisi.' };
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
    addToast('Data kegiatan berhasil diperbarui.');
    return { success: true };
  };

  const deleteActivity = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus kegiatan.' };
    }
    const hasOut = inventoryOut.some((o) => o.activityId === id);
    if (hasOut) {
      return {
        success: false,
        message: 'Kegiatan tidak dapat dihapus karena sudah memiliki data pengeluaran barang.',
      };
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));
    addToast('Data kegiatan berhasil dihapus.');
    return { success: true };
  };

  // Inventory In CRUD
  const addInventoryIn = (data: Omit<InventoryIn, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.souvenirId) {
      return { success: false, message: 'Barang wajib dipilih.' };
    }
    if (!data.date) {
      return { success: false, message: 'Tanggal masuk wajib diisi.' };
    }
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, message: 'Jumlah barang masuk harus berupa angka lebih dari 0.' };
    }

    const souv = souvenirs.find((s) => s.id === data.souvenirId);
    const categoryId = data.categoryId || souv?.categoryId || '';

    const now = new Date().toISOString();
    const newTx: InventoryIn = {
      id: `in-${Date.now()}`,
      souvenirId: data.souvenirId,
      categoryId,
      date: data.date,
      quantity: qty,
      description: data.description?.trim() || '',
      createdBy: currentUser?.name || 'PUR Inventory BI',
      createdAt: now,
      updatedAt: now,
    };

    setInventoryIn((prev) => [newTx, ...prev]);
    addToast('Transaksi barang masuk berhasil dicatat. Stok otomatis bertambah.');
    return { success: true };
  };

  const updateInventoryIn = (id: string, data: Partial<Omit<InventoryIn, 'id' | 'createdAt'>>) => {
    if (data.quantity !== undefined) {
      const qty = Number(data.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, message: 'Jumlah barang masuk harus lebih besar dari 0.' };
      }
    }

    setInventoryIn((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
              quantity: data.quantity !== undefined ? Number(data.quantity) : item.quantity,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
    addToast('Transaksi barang masuk berhasil diperbarui.');
    return { success: true };
  };

  const deleteInventoryIn = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus data barang masuk.' };
    }

    const tx = inventoryIn.find((i) => i.id === id);
    if (!tx) {
      return { success: false, message: 'Data penerimaan barang masuk tidak ditemukan.' };
    }

    setInventoryIn((prev) => prev.filter((i) => i.id !== id));
    addToast('Data barang masuk berhasil dihapus.', 'success');
    return { success: true };
  };

  // Inventory Out CRUD (Handles Multiple Items per Activity)
  const addInventoryOut = (
    data: Omit<InventoryOut, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
    items: { souvenirId: string; quantity: number; description?: string }[]
  ) => {
    if (!data.activityId) {
      return { success: false, message: 'Kegiatan wajib dipilih.' };
    }
    if (!data.date) {
      return { success: false, message: 'Tanggal keluar wajib diisi.' };
    }
    if (!items || items.length === 0) {
      return { success: false, message: 'Minimal harus menambahkan 1 souvenir.' };
    }

    // Check duplicates in submitted items array
    const souvenirIds = items.map((i) => i.souvenirId);
    const hasDuplicate = new Set(souvenirIds).size !== souvenirIds.length;
    if (hasDuplicate) {
      return { success: false, message: 'Terdapat jenis souvenir duplikat dalam satu form. Gabungkan jumlahnya.' };
    }

    // Validate each item stock
    for (const item of items) {
      if (!item.souvenirId) {
        return { success: false, message: 'Pilih souvenir untuk semua baris item.' };
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return { success: false, message: 'Jumlah setiap souvenir harus lebih dari 0.' };
      }

      const val = validateStockAvailability(item.souvenirId, qty);
      if (!val.valid) {
        return { success: false, message: val.message };
      }
    }

    const now = new Date().toISOString();
    const newOutId = `out-${Date.now()}`;

    const newOutHeader: InventoryOut = {
      id: newOutId,
      activityId: data.activityId,
      date: data.date,
      description: data.description?.trim() || '',
      createdBy: currentUser?.name || 'PUR Inventory BI',
      createdAt: now,
      updatedAt: now,
    };

    const newItems: InventoryOutItem[] = items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      inventoryOutId: newOutId,
      souvenirId: item.souvenirId,
      quantity: Number(item.quantity),
      description: item.description?.trim() || '',
      createdAt: now,
    }));

    setInventoryOut((prev) => [newOutHeader, ...prev]);
    setInventoryOutItems((prev) => [...prev, ...newItems]);
    addToast('Transaksi barang keluar berhasil disimpan. Stok otomatis berkurang.');
    return { success: true };
  };

  const updateInventoryOut = (
    id: string,
    data: Partial<Omit<InventoryOut, 'id' | 'createdAt' | 'items'>>,
    items?: { id?: string; souvenirId: string; quantity: number; description?: string }[]
  ) => {
    if (items && items.length > 0) {
      // Validate stock excluding current inventoryOutId
      for (const item of items) {
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return { success: false, message: 'Jumlah barang harus lebih besar dari 0.' };
        }
        const val = validateStockAvailability(item.souvenirId, qty, id);
        if (!val.valid) {
          return { success: false, message: val.message };
        }
      }

      const now = new Date().toISOString();
      const newItems: InventoryOutItem[] = items.map((item, idx) => ({
        id: item.id || `item-${Date.now()}-${idx}`,
        inventoryOutId: id,
        souvenirId: item.souvenirId,
        quantity: Number(item.quantity),
        description: item.description?.trim() || '',
        createdAt: now,
      }));

      // Replace items for this out transaction
      setInventoryOutItems((prev) => [...prev.filter((it) => it.inventoryOutId !== id), ...newItems]);
    }

    setInventoryOut((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    addToast('Transaksi barang keluar berhasil diperbarui.');
    return { success: true };
  };

  const deleteInventoryOut = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus transaksi barang keluar.' };
    }

    setInventoryOut((prev) => prev.filter((o) => o.id !== id));
    setInventoryOutItems((prev) => prev.filter((it) => it.inventoryOutId !== id));
    addToast('Transaksi barang keluar berhasil dihapus. Stok otomatis dikembalikan.');
    return { success: true };
  };

  // Reset Data to Factory Seeds
  const resetToInitialData = () => {
    setCategories(INITIAL_CATEGORIES);
    setSouvenirs(INITIAL_SOUVENIRS);
    setActivities(INITIAL_ACTIVITIES);
    setInventoryIn(INITIAL_INVENTORY_IN);
    setInventoryOut(INITIAL_INVENTORY_OUT);
    setInventoryOutItems(INITIAL_INVENTORY_OUT_ITEMS);
    setCurrentUserId(INITIAL_USERS[0].id);
    addToast('Database berhasil di-reset ke data awal pengujian.', 'info');
  };

  // Computed: Stock Summaries
  const stockSummaries = useMemo<SouvenirStockSummary[]>(() => {
    return souvenirs.map((souv) => {
      const cat = categories.find((c) => c.id === souv.categoryId);
      const categoryName = cat ? cat.name : 'Uncategorized';
      const categoryObj = cat || {
        id: souv.categoryId || '',
        name: categoryName,
        description: '',
        createdAt: '',
        updatedAt: '',
      };
      const { totalIn, totalOut, currentStock, status } = getSouvenirStock(souv.id);

      return {
        souvenir: souv,
        categoryName,
        category: categoryObj,
        totalIn,
        totalOut,
        currentStock,
        status,
      };
    });
  }, [souvenirs, categories, inventoryIn, inventoryOutItems]);

  // Computed: Transaction History Ledger (Combined IN and OUT)
  const transactionHistory = useMemo<TransactionHistoryItem[]>(() => {
    const list: TransactionHistoryItem[] = [];

    // Map In transactions
    inventoryIn.forEach((item) => {
      const souv = souvenirs.find((s) => s.id === item.souvenirId);
      const cat = categories.find((c) => c.id === (souv?.categoryId || item.categoryId));
      list.push({
        id: `in-tx-${item.id}`,
        originalTxId: item.id,
        date: item.date,
        type: 'IN',
        souvenirId: item.souvenirId,
        souvenirName: souv ? souv.name : 'Barang Dihapus',
        categoryName: cat ? cat.name : '-',
        quantity: item.quantity,
        unit: souv?.unit || 'pcs',
        user: item.createdBy || 'Petugas Logistik',
        description: item.description || 'Penerimaan Barang Masuk',
        createdAt: item.createdAt,
      });
    });

    // Map Out transactions
    inventoryOut.forEach((outHeader) => {
      const activity = activities.find((a) => a.id === outHeader.activityId);
      const outItems = inventoryOutItems.filter((it) => it.inventoryOutId === outHeader.id);

      outItems.forEach((outItem) => {
        const souv = souvenirs.find((s) => s.id === outItem.souvenirId);
        const cat = categories.find((c) => c.id === souv?.categoryId);
        list.push({
          id: `out-tx-${outItem.id}`,
          originalTxId: outHeader.id,
          subItemId: outItem.id,
          date: outHeader.date,
          type: 'OUT',
          souvenirId: outItem.souvenirId,
          souvenirName: souv ? souv.name : 'Barang Dihapus',
          categoryName: cat ? cat.name : '-',
          quantity: outItem.quantity,
          unit: souv?.unit || 'pcs',
          activityId: outHeader.activityId,
          activityName: activity ? activity.name : 'Kegiatan',
          user: outHeader.createdBy || 'Petugas Logistik',
          description: outItem.description || outHeader.description || 'Pengeluaran Kegiatan',
          createdAt: outItem.createdAt || outHeader.createdAt,
        });
      });
    });

    // Sort by Date DESC, then CreatedAt DESC
    return list.sort((a, b) => {
      const dateCmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [inventoryIn, inventoryOut, inventoryOutItems, souvenirs, categories, activities]);

  // Computed: Reporting Records (Grouped by Activity)
  const reportingRecords = useMemo<ReportingRecord[]>(() => {
    return activities.map((activity) => {
      const relatedOuts = inventoryOut.filter((o) => o.activityId === activity.id);
      const outIds = relatedOuts.map((o) => o.id);
      const relatedItems = inventoryOutItems.filter((it) => outIds.includes(it.inventoryOutId));

      const items = relatedItems.map((item) => {
        const souv = souvenirs.find((s) => s.id === item.souvenirId);
        const cat = categories.find((c) => c.id === souv?.categoryId);
        return {
          souvenirId: item.souvenirId,
          souvenirName: souv ? souv.name : 'Barang',
          categoryName: cat ? cat.name : '-',
          quantity: item.quantity,
          unit: souv?.unit || 'pcs',
          description: item.description,
        };
      });

      const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);

      return {
        activityId: activity.id,
        activityName: activity.name,
        pic: activity.pic,
        activityDate: activity.activityDate,
        location: activity.location,
        items,
        totalItems,
        inventoryOutIds: outIds,
      };
    });
  }, [activities, inventoryOut, inventoryOutItems, souvenirs, categories]);

  const value = {
    users,
    currentUser,
    isAuthenticated,
    login,
    logout,
    categories,
    souvenirs,
    activities,
    inventoryIn,
    inventoryOut,
    inventoryOutItems,
    toasts,
    switchUser,
    isAdmin,
    updateProfile,
    changePassword,
    addCategory,
    updateCategory,
    deleteCategory,
    addSouvenir,
    updateSouvenir,
    deleteSouvenir,
    addActivity,
    updateActivity,
    deleteActivity,
    addInventoryIn,
    updateInventoryIn,
    deleteInventoryIn,
    addInventoryOut,
    updateInventoryOut,
    deleteInventoryOut,
    getSouvenirStock,
    validateStockAvailability,
    stockSummaries,
    transactionHistory,
    reportingRecords,
    addToast,
    removeToast,
    resetToInitialData,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
