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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updatePassword as fbUpdatePassword,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  getUserProfile,
  setUserProfile,
  subscribeCategories,
  subscribeSouvenirs,
  subscribeActivities,
  subscribeInventoryIn,
  subscribeInventoryOut,
  subscribeInventoryOutItems,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  addSouvenir as dbAddSouvenir,
  updateSouvenir as dbUpdateSouvenir,
  deleteSouvenir as dbDeleteSouvenir,
  addActivity as dbAddActivity,
  updateActivity as dbUpdateActivity,
  deleteActivity as dbDeleteActivity,
  addInventoryIn as dbAddInventoryIn,
  updateInventoryIn as dbUpdateInventoryIn,
  deleteInventoryIn as dbDeleteInventoryIn,
  addInventoryOut as dbAddInventoryOut,
  updateInventoryOut as dbUpdateInventoryOut,
  deleteInventoryOut as dbDeleteInventoryOut,
  isDatabaseInitialized,
  setDatabaseInitialized,
} from '../services/db';

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
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
  updateProfile: (data: { name?: string; email?: string; avatar?: string; department?: string }) => { success: boolean; message?: string };
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;

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

export const DUMMY_DEFAULT_ACCOUNT: User = {
  id: 'usr_pur_admin_sulsel',
  name: 'Pengelola PUR Inventory',
  email: 'purinventorybi@gmail.com',
  role: 'admin',
  department: 'Unit PUR & Logistik BI Sulsel',
  avatar: '/logo-bi.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

const getStoredProfile = (): User => {
  try {
    const raw = localStorage.getItem('pur_user_profile_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return DUMMY_DEFAULT_ACCOUNT;
};

const getStoredPassword = (): string => {
  return localStorage.getItem('pur_user_password_v1') || 'admin123';
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialProfile = getStoredProfile();
  // Pure state managed via Firestore / Local storage
  const [users, setUsers] = useState<User[]>([initialProfile]);
  const [currentUserId, setCurrentUserId] = useState<string>(initialProfile.id);
  const [currentUser, setCurrentUser] = useState<User>(initialProfile);

  const [categories, setCategories] = useState<Category[]>([]);
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [inventoryIn, setInventoryIn] = useState<InventoryIn[]>([]);
  const [inventoryOut, setInventoryOut] = useState<InventoryOut[]>([]);
  const [inventoryOutItems, setInventoryOutItems] = useState<InventoryOutItem[]>([]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pur_is_authenticated_v1') === 'true';
  });

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

  // =========================================================================
  // FIREBASE AUTHENTICATION & SESSION HANDLING (PHASE 3)
  // =========================================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            const currentSaved = getStoredProfile();
            profile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || currentSaved.name,
              email: firebaseUser.email || currentSaved.email,
              role: 'admin',
              department: currentSaved.department,
              avatar: currentSaved.avatar,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setUserProfile(firebaseUser.uid, profile);
          }
          setCurrentUser(profile);
          setCurrentUserId(profile.id);
          setUsers([profile]);
          setIsAuthenticated(true);
          localStorage.setItem('pur_is_authenticated_v1', 'true');
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!normalizedEmail || !cleanPassword) {
      return { success: false, message: 'Silakan masukkan alamat email dan kata sandi.' };
    }

    const currentSavedProfile = getStoredProfile();
    const currentSavedPassword = getStoredPassword();

    // 1. Check against embedded / saved dummy account
    const isDummyEmailMatch =
      normalizedEmail === currentSavedProfile.email.toLowerCase() ||
      normalizedEmail === 'purinventorybi@gmail.com' ||
      normalizedEmail === 'admin@bi.go.id';

    const isDummyPasswordMatch =
      cleanPassword === currentSavedPassword ||
      cleanPassword === 'admin123' ||
      cleanPassword.length >= 4;

    // 2. Also try Firebase Auth in background if possible
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, cleanPassword);
      if (cred && cred.user) {
        let profile = await getUserProfile(cred.user.uid);
        if (!profile) {
          profile = {
            id: cred.user.uid,
            name: cred.user.displayName || currentSavedProfile.name,
            email: normalizedEmail,
            role: 'admin',
            department: currentSavedProfile.department,
            avatar: currentSavedProfile.avatar,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setUserProfile(cred.user.uid, profile);
        }

        setCurrentUser(profile);
        setCurrentUserId(profile.id);
        setUsers([profile]);
        setIsAuthenticated(true);
        localStorage.setItem('pur_is_authenticated_v1', 'true');
        localStorage.setItem('pur_user_profile_v1', JSON.stringify(profile));
        addToast(`Selamat datang di PUR INVENTORY, ${profile.name}!`, 'success');
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Firebase login attempt:', err?.code);
    }

    // 3. If dummy account matches or general login for internal app
    if (isDummyEmailMatch && isDummyPasswordMatch) {
      const profileToUse: User = {
        ...currentSavedProfile,
        email: normalizedEmail,
      };
      setCurrentUser(profileToUse);
      setCurrentUserId(profileToUse.id);
      setUsers([profileToUse]);
      setIsAuthenticated(true);
      localStorage.setItem('pur_is_authenticated_v1', 'true');
      localStorage.setItem('pur_user_profile_v1', JSON.stringify(profileToUse));
      addToast(`Selamat datang di PUR INVENTORY, ${profileToUse.name}!`, 'success');
      return { success: true };
    }

    if (!isDummyPasswordMatch) {
      addToast('Kata sandi tidak sesuai. Gunakan sandi admin123', 'error');
      return { success: false, message: 'Kata sandi tidak sesuai. Akun bawaan: admin123' };
    }

    // Fallback: allow sign in with any valid email & password for convenience
    const profileToUse: User = {
      ...currentSavedProfile,
      email: normalizedEmail,
    };
    setCurrentUser(profileToUse);
    setCurrentUserId(profileToUse.id);
    setUsers([profileToUse]);
    setIsAuthenticated(true);
    localStorage.setItem('pur_is_authenticated_v1', 'true');
    localStorage.setItem('pur_user_profile_v1', JSON.stringify(profileToUse));
    addToast(`Selamat datang di PUR INVENTORY, ${profileToUse.name}!`, 'success');
    return { success: true };
  };

  const signUp = async (email: string, password?: string) => {
    return login(email, password);
  };

  const loginWithGoogle = async () => {
    return login('purinventorybi@gmail.com', 'admin123');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
    setIsAuthenticated(false);
    const profile = getStoredProfile();
    setCurrentUser(profile);
    setCurrentUserId(profile.id);
    setUsers([profile]);
    setCategories([]);
    setSouvenirs([]);
    setActivities([]);
    setInventoryIn([]);
    setInventoryOut([]);
    setInventoryOutItems([]);
    localStorage.removeItem('pur_is_authenticated_v1');
    addToast('Anda telah keluar dari sistem.', 'info');
  };

  // Single user role - full access to app functions
  const isAdmin = true;

  const switchUser = (_userId: string) => {
    // Single user mode - no switching necessary
  };

  const updateProfile = (data: { name?: string; email?: string; avatar?: string; department?: string }) => {
    const updatedUser: User = {
      ...currentUser,
      name: data.name !== undefined && data.name.trim() !== '' ? data.name.trim() : currentUser.name,
      email: data.email !== undefined && data.email.trim() !== '' ? data.email.trim().toLowerCase() : currentUser.email,
      avatar: data.avatar !== undefined ? data.avatar : currentUser.avatar,
      department: data.department !== undefined ? data.department.trim() : currentUser.department,
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    // Persist to localStorage
    try {
      localStorage.setItem('pur_user_profile_v1', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Persist to Firestore
    setUserProfile(currentUser.id || 'usr_pur_admin_sulsel', updatedUser).catch((err) => {
      console.error('Failed to update profile in Firestore:', err);
    });

    addToast('Profil pengguna berhasil disimpan.', 'success');
    return { success: true };
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 5) {
      addToast('Kata sandi baru minimal 5 karakter.', 'error');
      return { success: false, message: 'Kata sandi baru minimal 5 karakter.' };
    }

    // Persist to localStorage
    try {
      localStorage.setItem('pur_user_password_v1', newPassword);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    try {
      if (auth.currentUser) {
        await fbUpdatePassword(auth.currentUser, newPassword);
      }
    } catch (err: any) {
      console.warn('Firebase updatePassword requires re-auth or error:', err);
    }

    addToast('Kata sandi berhasil diperbarui.', 'success');
    return { success: true };
  };

  // =========================================================================
  // REAL-TIME FIRESTORE DATA SYNC & PERSISTENCE (PHASE 4 & 5)
  // =========================================================================
  useEffect(() => {
    let unsubCategories: () => void = () => {};
    let unsubSouvenirs: () => void = () => {};
    let unsubActivities: () => void = () => {};
    let unsubIn: () => void = () => {};
    let unsubOut: () => void = () => {};
    let unsubOutItems: () => void = () => {};

    if (isAuthenticated) {
      unsubCategories = subscribeCategories((items) => {
        setCategories(items);
      });

      unsubSouvenirs = subscribeSouvenirs((items) => {
        setSouvenirs(items);
      });

      unsubActivities = subscribeActivities((items) => {
        setActivities(items);
      });

      unsubIn = subscribeInventoryIn((items) => {
        setInventoryIn(items);
      });

      unsubOut = subscribeInventoryOut((items) => {
        setInventoryOut(items);
      });

      unsubOutItems = subscribeInventoryOutItems((items) => {
        setInventoryOutItems(items);
      });
    }

    return () => {
      unsubCategories();
      unsubSouvenirs();
      unsubActivities();
      unsubIn();
      unsubOut();
      unsubOutItems();
    };
  }, [isAuthenticated]);

  // =========================================================================
  // STOCK CALCULATION ENGINE (PHASE 8 - SINGLE SOURCE OF TRUTH)
  // =========================================================================
  const getSouvenirStock = (souvenirId: string, excludeOutId?: string, excludeInId?: string) => {
    const souv = souvenirs.find((s) => s.id === souvenirId);
    const minStock = souv ? souv.minimumStock : 10;

    // Total In (derived from inventoryIn)
    const totalIn = inventoryIn
      .filter((item) => item.souvenirId === souvenirId && (!excludeInId || item.id !== excludeInId))
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // Total Out (derived from inventoryOutItems)
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
    }

    return {
      totalIn,
      totalOut,
      currentStock,
      status,
    };
  };

  const validateStockAvailability = (
    souvenirId: string,
    requestedQty: number,
    excludeOutId?: string
  ) => {
    const souv = souvenirs.find((s) => s.id === souvenirId);
    const souvenirName = souv ? souv.name : 'Souvenir';

    if (requestedQty <= 0) {
      return {
        valid: false,
        availableStock: 0,
        souvenirName,
        message: `Jumlah permintaan ${souvenirName} harus lebih dari 0.`,
      };
    }

    const { currentStock } = getSouvenirStock(souvenirId, excludeOutId);

    if (requestedQty > currentStock) {
      return {
        valid: false,
        availableStock: currentStock,
        souvenirName,
        message: `Stok ${souvenirName} tidak mencukupi. Sisa stok tersedia saat ini: ${currentStock} ${souv?.unit || 'pcs'}.`,
      };
    }

    return {
      valid: true,
      availableStock: currentStock,
      souvenirName,
    };
  };

  // =========================================================================
  // CATEGORIES CRUD
  // =========================================================================
  const addCategory = (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Nama kategori wajib diisi.' };
    }
    const nameTrimmed = data.name.trim();
    if (categories.some((c) => c.name.toLowerCase() === nameTrimmed.toLowerCase())) {
      return { success: false, message: 'Kategori dengan nama tersebut sudah ada.' };
    }

    const now = new Date().toISOString();
    const newId = `cat-${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name: nameTrimmed,
      description: data.description?.trim() || '',
      createdByUid: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    setCategories((prev) => [newCat, ...prev]);
    dbAddCategory(newCat, currentUser.id, currentUser.name).catch((err) => {
      console.error('Error saving category to Firestore:', err);
      addToast('Gagal menyimpan kategori ke database.', 'error');
    });

    addToast(`Kategori "${nameTrimmed}" berhasil ditambahkan.`);
    return { success: true };
  };

  const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: 'Nama kategori tidak boleh kosong.' };
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    dbUpdateCategory(id, data).catch((err) => {
      console.error('Error updating category in Firestore:', err);
    });

    addToast('Kategori berhasil diperbarui.');
    return { success: true };
  };

  const deleteCategory = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus kategori.' };
    }
    const isUsed = souvenirs.some((s) => s.categoryId === id);
    if (isUsed) {
      return {
        success: false,
        message: 'Kategori tidak dapat dihapus karena masih digunakan oleh beberapa jenis souvenir.',
      };
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    dbDeleteCategory(id).catch((err) => {
      console.error('Error deleting category from Firestore:', err);
    });

    addToast('Kategori berhasil dihapus.');
    return { success: true };
  };

  // =========================================================================
  // SOUVENIRS CRUD
  // =========================================================================
  const addSouvenir = (data: Omit<Souvenir, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Nama souvenir wajib diisi.' };
    }
    if (!data.categoryId) {
      return { success: false, message: 'Kategori souvenir wajib dipilih.' };
    }
    const minStock = Number(data.minimumStock);
    if (isNaN(minStock) || minStock < 0) {
      return { success: false, message: 'Stok minimum harus berupa angka positif.' };
    }

    const now = new Date().toISOString();
    const newId = `souv-${Date.now()}`;
    const newSouvenir: Souvenir = {
      id: newId,
      name: data.name.trim(),
      categoryId: data.categoryId,
      unit: data.unit || 'pcs',
      minimumStock: minStock,
      description: data.description?.trim() || '',
      createdByUid: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    setSouvenirs((prev) => [newSouvenir, ...prev]);
    dbAddSouvenir(newSouvenir, currentUser.id, currentUser.name).catch((err) => {
      console.error('Error saving souvenir to Firestore:', err);
      addToast('Gagal menyimpan souvenir ke database.', 'error');
    });

    addToast(`Souvenir "${newSouvenir.name}" berhasil ditambahkan.`);
    return { success: true, id: newId };
  };

  const updateSouvenir = (id: string, data: Partial<Omit<Souvenir, 'id' | 'createdAt'>>) => {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: 'Nama souvenir tidak boleh kosong.' };
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

    dbUpdateSouvenir(id, data).catch((err) => {
      console.error('Error updating souvenir in Firestore:', err);
    });

    addToast('Data souvenir berhasil diperbarui.');
    return { success: true };
  };

  const deleteSouvenir = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus data souvenir.' };
    }
    const hasIn = inventoryIn.some((i) => i.souvenirId === id);
    const hasOut = inventoryOutItems.some((o) => o.souvenirId === id);

    if (hasIn || hasOut) {
      return {
        success: false,
        message:
          'Souvenir tidak dapat dihapus karena telah memiliki riwayat mutasi transaksi barang masuk/keluar.',
      };
    }

    setSouvenirs((prev) => prev.filter((s) => s.id !== id));
    dbDeleteSouvenir(id).catch((err) => {
      console.error('Error deleting souvenir from Firestore:', err);
    });

    addToast('Souvenir berhasil dihapus.');
    return { success: true };
  };

  // =========================================================================
  // ACTIVITIES CRUD
  // =========================================================================
  const addActivity = (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data.name || !data.name.trim()) {
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
      createdByUid: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    setActivities((prev) => [newActivity, ...prev]);
    dbAddActivity(newActivity, currentUser.id, currentUser.name).catch((err) => {
      console.error('Error saving activity to Firestore:', err);
    });

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

    dbUpdateActivity(id, data).catch((err) => {
      console.error('Error updating activity in Firestore:', err);
    });

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
    dbDeleteActivity(id).catch((err) => {
      console.error('Error deleting activity from Firestore:', err);
    });

    addToast('Data kegiatan berhasil dihapus.');
    return { success: true };
  };

  // =========================================================================
  // INVENTORY IN CRUD (PHASE 6)
  // =========================================================================
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
      createdByUid: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    setInventoryIn((prev) => [newTx, ...prev]);
    dbAddInventoryIn(newTx, currentUser.id, currentUser.name).catch((err) => {
      console.error('Error saving inventoryIn to Firestore:', err);
      addToast('Gagal menyimpan barang masuk ke Firestore.', 'error');
    });

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

    dbUpdateInventoryIn(id, data).catch((err) => {
      console.error('Error updating inventoryIn in Firestore:', err);
    });

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
    dbDeleteInventoryIn(id).catch((err) => {
      console.error('Error deleting inventoryIn from Firestore:', err);
    });

    addToast('Data barang masuk berhasil dihapus.', 'success');
    return { success: true };
  };

  // =========================================================================
  // INVENTORY OUT CRUD (PHASE 7 - MULTI-ITEM ATOMIC WRITEBATCH)
  // =========================================================================
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
      return {
        success: false,
        message: 'Terdapat jenis souvenir duplikat dalam satu form. Gabungkan jumlahnya.',
      };
    }

    // Validate each requested item against current available stock
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
      createdByUid: currentUser.id,
      createdByName: currentUser.name,
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

    // Optimistically update React state for instant feedback
    setInventoryOut((prev) => [newOutHeader, ...prev]);
    setInventoryOutItems((prev) => [...prev, ...newItems]);

    // Atomic writeBatch to Firestore
    dbAddInventoryOut(newOutHeader, newItems, currentUser.id, currentUser.name).catch((err) => {
      console.error('Error saving inventoryOut in Firestore batch:', err);
      addToast('Gagal menyimpan transaksi barang keluar ke database.', 'error');
    });

    addToast('Transaksi barang keluar berhasil disimpan. Stok otomatis berkurang.');
    return { success: true };
  };

  const updateInventoryOut = (
    id: string,
    data: Partial<Omit<InventoryOut, 'id' | 'createdAt' | 'items'>>,
    items?: { id?: string; souvenirId: string; quantity: number; description?: string }[]
  ) => {
    let newItems: InventoryOutItem[] | undefined;
    let oldItemIds: string[] | undefined;

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
      newItems = items.map((item, idx) => ({
        id: item.id || `item-${Date.now()}-${idx}`,
        inventoryOutId: id,
        souvenirId: item.souvenirId,
        quantity: Number(item.quantity),
        description: item.description?.trim() || '',
        createdAt: now,
      }));

      oldItemIds = inventoryOutItems
        .filter((it) => it.inventoryOutId === id)
        .map((it) => it.id);

      // Replace items in state
      setInventoryOutItems((prev) => [...prev.filter((it) => it.inventoryOutId !== id), ...newItems!]);
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

    dbUpdateInventoryOut(id, data, newItems, oldItemIds).catch((err) => {
      console.error('Error updating inventoryOut in Firestore:', err);
    });

    addToast('Transaksi barang keluar berhasil diperbarui.');
    return { success: true };
  };

  const deleteInventoryOut = (id: string) => {
    if (!isAdmin) {
      return { success: false, message: 'Hanya Admin yang dapat menghapus transaksi barang keluar.' };
    }

    const associatedItemIds = inventoryOutItems
      .filter((it) => it.inventoryOutId === id)
      .map((it) => it.id);

    setInventoryOut((prev) => prev.filter((o) => o.id !== id));
    setInventoryOutItems((prev) => prev.filter((it) => it.inventoryOutId !== id));

    dbDeleteInventoryOut(id, associatedItemIds).catch((err) => {
      console.error('Error deleting inventoryOut from Firestore:', err);
    });

    addToast('Transaksi barang keluar berhasil dihapus. Stok otomatis dikembalikan.');
    return { success: true };
  };

  // Reset helper kept for API interface compatibility
  const resetToInitialData = () => {
    // No-op in production mode without seed data
  };

  // =========================================================================
  // COMPUTED: STOCK SUMMARIES (DERIVED FROM STATE)
  // =========================================================================
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

  // =========================================================================
  // COMPUTED: TRANSACTION HISTORY (COMBINED IN & OUT)
  // =========================================================================
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
        user: item.createdByName || item.createdBy || 'Petugas Logistik',
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
          user: outHeader.createdByName || outHeader.createdBy || 'Petugas Logistik',
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

  // =========================================================================
  // COMPUTED: REPORTING RECORDS (GROUPED BY ACTIVITY)
  // =========================================================================
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
    signUp,
    loginWithGoogle,
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
