import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Category,
  Souvenir,
  Activity,
  InventoryIn,
  InventoryOut,
  InventoryOutItem,
  User,
} from '../types';

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  SOUVENIRS: 'souvenirs',
  ACTIVITIES: 'activities',
  INVENTORY_IN: 'inventoryIn',
  INVENTORY_OUT: 'inventoryOut',
  INVENTORY_OUT_ITEMS: 'inventoryOutItems',
} as const;

// Helper to clean undefined values before saving to Firestore
const cleanData = <T extends Record<string, any>>(data: T): T => {
  const result: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
};

// ==========================================
// 1. USER PROFILE OPERATIONS
// ==========================================
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function setUserProfile(uid: string, profile: Partial<User>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  const now = new Date().toISOString();
  await setDoc(
    docRef,
    cleanData({
      ...profile,
      id: uid,
      updatedAt: now,
    }),
    { merge: true }
  );
}

// ==========================================
// 2. CATEGORIES CRUD & SUBSCRIPTION
// ==========================================
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export function subscribeCategories(callback: (items: Category[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.CATEGORIES),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      callback(items);
    },
    (err) => console.error('Error subscribing to categories:', err)
  );
}

export async function addCategory(
  item: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  createdByUid?: string,
  createdByName?: string
): Promise<string> {
  const id = item.id || `cat-${Date.now()}`;
  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
  await setDoc(
    docRef,
    cleanData({
      ...item,
      id,
      createdByUid: createdByUid || null,
      createdByName: createdByName || null,
      createdAt: now,
      updatedAt: now,
    })
  );
  return id;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
  const now = new Date().toISOString();
  await updateDoc(
    docRef,
    cleanData({
      ...updates,
      updatedAt: now,
    })
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, id);
  await deleteDoc(docRef);
}

// ==========================================
// 3. SOUVENIRS CRUD & SUBSCRIPTION
// ==========================================
export async function getSouvenirs(): Promise<Souvenir[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.SOUVENIRS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Souvenir));
}

export function subscribeSouvenirs(callback: (items: Souvenir[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.SOUVENIRS),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Souvenir));
      callback(items);
    },
    (err) => console.error('Error subscribing to souvenirs:', err)
  );
}

export async function addSouvenir(
  item: Omit<Souvenir, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  createdByUid?: string,
  createdByName?: string
): Promise<string> {
  const id = item.id || `souv-${Date.now()}`;
  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTIONS.SOUVENIRS, id);
  await setDoc(
    docRef,
    cleanData({
      ...item,
      id,
      createdByUid: createdByUid || null,
      createdByName: createdByName || null,
      createdAt: now,
      updatedAt: now,
    })
  );
  return id;
}

export async function updateSouvenir(id: string, updates: Partial<Souvenir>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SOUVENIRS, id);
  const now = new Date().toISOString();
  await updateDoc(
    docRef,
    cleanData({
      ...updates,
      updatedAt: now,
    })
  );
}

export async function deleteSouvenir(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SOUVENIRS, id);
  await deleteDoc(docRef);
}

// ==========================================
// 4. ACTIVITIES CRUD & SUBSCRIPTION
// ==========================================
export async function getActivities(): Promise<Activity[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
}

export function subscribeActivities(callback: (items: Activity[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.ACTIVITIES),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
      callback(items);
    },
    (err) => console.error('Error subscribing to activities:', err)
  );
}

export async function addActivity(
  item: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  createdByUid?: string,
  createdByName?: string
): Promise<string> {
  const id = item.id || `act-${Date.now()}`;
  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTIONS.ACTIVITIES, id);
  await setDoc(
    docRef,
    cleanData({
      ...item,
      id,
      createdByUid: createdByUid || null,
      createdByName: createdByName || null,
      createdAt: now,
      updatedAt: now,
    })
  );
  return id;
}

export async function updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ACTIVITIES, id);
  const now = new Date().toISOString();
  await updateDoc(
    docRef,
    cleanData({
      ...updates,
      updatedAt: now,
    })
  );
}

export async function deleteActivity(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ACTIVITIES, id);
  await deleteDoc(docRef);
}

// ==========================================
// 5. INVENTORY IN CRUD & SUBSCRIPTION
// ==========================================
export async function getInventoryIn(): Promise<InventoryIn[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY_IN));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryIn));
}

export function subscribeInventoryIn(callback: (items: InventoryIn[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.INVENTORY_IN),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryIn));
      callback(items);
    },
    (err) => console.error('Error subscribing to inventoryIn:', err)
  );
}

export async function addInventoryIn(
  item: Omit<InventoryIn, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  createdByUid?: string,
  createdByName?: string
): Promise<string> {
  if (item.quantity <= 0) {
    throw new Error('Jumlah barang masuk harus lebih dari 0.');
  }
  const id = item.id || `in-${Date.now()}`;
  const now = new Date().toISOString();
  const uid = auth.currentUser?.uid || createdByUid || item.createdByUid || '';
  const name = createdByName || item.createdByName || item.createdBy || 'Petugas';
  const docRef = doc(db, COLLECTIONS.INVENTORY_IN, id);
  await setDoc(
    docRef,
    cleanData({
      ...item,
      id,
      quantity: Number(item.quantity),
      createdBy: name,
      createdByUid: uid,
      createdByName: name,
      createdAt: now,
      updatedAt: now,
    })
  );
  return id;
}

export async function updateInventoryIn(id: string, updates: Partial<InventoryIn>): Promise<void> {
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    throw new Error('Jumlah barang masuk harus lebih dari 0.');
  }
  const docRef = doc(db, COLLECTIONS.INVENTORY_IN, id);
  const now = new Date().toISOString();
  await updateDoc(
    docRef,
    cleanData({
      ...updates,
      updatedAt: now,
    })
  );
}

export async function deleteInventoryIn(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.INVENTORY_IN, id);
  await deleteDoc(docRef);
}

// ==========================================
// 6. INVENTORY OUT & ITEMS CRUD & SUBSCRIPTION
// ==========================================
export async function getInventoryOut(): Promise<InventoryOut[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY_OUT));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryOut));
}

export function subscribeInventoryOut(callback: (items: InventoryOut[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.INVENTORY_OUT),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryOut));
      callback(items);
    },
    (err) => console.error('Error subscribing to inventoryOut:', err)
  );
}

export async function getInventoryOutItems(): Promise<InventoryOutItem[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY_OUT_ITEMS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryOutItem));
}

export function subscribeInventoryOutItems(callback: (items: InventoryOutItem[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTIONS.INVENTORY_OUT_ITEMS),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryOutItem));
      callback(items);
    },
    (err) => console.error('Error subscribing to inventoryOutItems:', err)
  );
}

/**
 * Atomic multi-item Inventory Out creation with writeBatch
 */
export async function addInventoryOut(
  outData: Omit<InventoryOut, 'id' | 'items' | 'createdAt' | 'updatedAt'> & { id?: string },
  items: Array<Omit<InventoryOutItem, 'id' | 'inventoryOutId' | 'createdAt'> & { id?: string }>,
  createdByUid?: string,
  createdByName?: string
): Promise<{ outId: string; itemIds: string[] }> {
  if (!items || items.length === 0) {
    throw new Error('Minimal satu jenis souvenir harus dipilih untuk dikeluarkan.');
  }

  for (const it of items) {
    if (it.quantity <= 0) {
      throw new Error('Jumlah setiap souvenir harus lebih dari 0.');
    }
  }

  const batch = writeBatch(db);
  const outId = outData.id || `out-${Date.now()}`;
  const now = new Date().toISOString();
  const uid = auth.currentUser?.uid || createdByUid || outData.createdByUid || '';
  const name = createdByName || outData.createdByName || outData.createdBy || 'Petugas';

  // 1. Header Document
  const outDocRef = doc(db, COLLECTIONS.INVENTORY_OUT, outId);
  batch.set(
    outDocRef,
    cleanData({
      ...outData,
      id: outId,
      createdBy: name,
      createdByUid: uid,
      createdByName: name,
      createdAt: now,
      updatedAt: now,
    })
  );

  // 2. Detail Item Documents
  const itemIds: string[] = [];
  items.forEach((it, idx) => {
    const itemId = it.id || `item-${Date.now()}-${idx}`;
    itemIds.push(itemId);
    const itemDocRef = doc(db, COLLECTIONS.INVENTORY_OUT_ITEMS, itemId);
    batch.set(
      itemDocRef,
      cleanData({
        ...it,
        id: itemId,
        inventoryOutId: outId,
        quantity: Number(it.quantity),
        createdAt: now,
      })
    );
  });

  await batch.commit();
  return { outId, itemIds };
}

/**
 * Atomic update of an Inventory Out transaction and its items
 */
export async function updateInventoryOut(
  outId: string,
  outUpdates: Partial<InventoryOut>,
  items?: Array<Omit<InventoryOutItem, 'id' | 'inventoryOutId' | 'createdAt'> & { id?: string }>,
  existingItemIds?: string[]
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Update Header
  const outDocRef = doc(db, COLLECTIONS.INVENTORY_OUT, outId);
  batch.update(
    outDocRef,
    cleanData({
      ...outUpdates,
      updatedAt: now,
    })
  );

  // 2. Replace items if provided
  if (items) {
    // Delete existing items for this inventoryOutId
    if (existingItemIds && existingItemIds.length > 0) {
      for (const oldId of existingItemIds) {
        batch.delete(doc(db, COLLECTIONS.INVENTORY_OUT_ITEMS, oldId));
      }
    } else {
      // Query items for this inventoryOutId if not explicitly provided
      const q = query(
        collection(db, COLLECTIONS.INVENTORY_OUT_ITEMS),
        where('inventoryOutId', '==', outId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => batch.delete(d.ref));
    }

    // Insert updated items
    items.forEach((it, idx) => {
      const itemId = it.id || `item-${Date.now()}-${idx}`;
      const itemDocRef = doc(db, COLLECTIONS.INVENTORY_OUT_ITEMS, itemId);
      batch.set(
        itemDocRef,
        cleanData({
          ...it,
          id: itemId,
          inventoryOutId: outId,
          createdAt: now,
        })
      );
    });
  }

  await batch.commit();
}

/**
 * Atomic deletion of an Inventory Out transaction and all associated items
 */
export async function deleteInventoryOut(
  outId: string,
  associatedItemIds?: string[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete header
  batch.delete(doc(db, COLLECTIONS.INVENTORY_OUT, outId));

  // 2. Delete all detail items
  if (associatedItemIds && associatedItemIds.length > 0) {
    for (const itemId of associatedItemIds) {
      batch.delete(doc(db, COLLECTIONS.INVENTORY_OUT_ITEMS, itemId));
    }
  } else {
    const q = query(
      collection(db, COLLECTIONS.INVENTORY_OUT_ITEMS),
      where('inventoryOutId', '==', outId)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => batch.delete(d.ref));
  }

  await batch.commit();
}

// ==========================================
// 7. SYSTEM INITIALIZATION METADATA
// ==========================================
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const metaRef = doc(db, 'system', 'metadata');
    const snap = await getDoc(metaRef);
    if (snap.exists() && snap.data()?.isInitialized === true) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking isDatabaseInitialized:', error);
    return false;
  }
}

export async function setDatabaseInitialized(): Promise<void> {
  try {
    const metaRef = doc(db, 'system', 'metadata');
    await setDoc(
      metaRef,
      {
        isInitialized: true,
        initializedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error setting database initialized:', error);
  }
}
