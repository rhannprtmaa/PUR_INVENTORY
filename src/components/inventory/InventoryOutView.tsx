import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Boxes,
  CalendarCheck,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  X,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryOut, InventoryOutItem } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDateIndo } from '../../utils/exportUtils';
import { StockBadge } from '../common/Badge';

interface InventoryOutViewProps {
  initialActivityId?: string;
  onClearInitialActivityId?: () => void;
  onSelectSouvenirDetail?: (souvenirId: string) => void;
}

interface RepeaterItem {
  id?: string;
  souvenirId: string;
  quantity: number | string;
  description: string;
}

export const InventoryOutView: React.FC<InventoryOutViewProps> = ({
  initialActivityId,
  onClearInitialActivityId,
  onSelectSouvenirDetail,
}) => {
  const {
    inventoryOut,
    inventoryOutItems,
    activities,
    souvenirs,
    categories,
    getSouvenirStock,
    addInventoryOut,
    updateInventoryOut,
    deleteInventoryOut,
    isAdmin,
    addToast,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivityId, setFilterActivityId] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Minimalist Popovers State & Click-outside Handling
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const activityPopoverRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (activityPopoverRef.current && !activityPopoverRef.current.contains(target)) {
        setIsActivityOpen(false);
      }
      if (datePopoverRef.current && !datePopoverRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOut, setEditingOut] = useState<InventoryOut | null>(null);

  // Form State
  const [activityId, setActivityId] = useState(initialActivityId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [repeaterItems, setRepeaterItems] = useState<RepeaterItem[]>([
    { souvenirId: '', quantity: 10, description: '' },
  ]);
  const [formError, setFormError] = useState('');

  // Detail Modal State
  const [detailOut, setDetailOut] = useState<InventoryOut | null>(null);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Sync if initialActivityId passed
  React.useEffect(() => {
    if (initialActivityId) {
      setActivityId(initialActivityId);
      openAddModalWithActivity(initialActivityId);
      onClearInitialActivityId?.();
    }
  }, [initialActivityId, onClearInitialActivityId]);

  // Derived filtered list
  const filteredList = useMemo(() => {
    return inventoryOut.filter((outHeader) => {
      const activity = activities.find((a) => a.id === outHeader.activityId);
      const actName = activity?.name || '';
      const pic = activity?.pic || '';
      const outDesc = outHeader.description || '';

      const matchSearch =
        actName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outDesc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchActivity = filterActivityId === 'ALL' || outHeader.activityId === filterActivityId;

      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && outHeader.date >= filterStartDate;
      }
      if (filterEndDate) {
        matchDate = matchDate && outHeader.date <= filterEndDate;
      }

      return matchSearch && matchActivity && matchDate;
    });
  }, [inventoryOut, activities, searchTerm, filterActivityId, filterStartDate, filterEndDate]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const openAddModalWithActivity = (actId?: string) => {
    if (activities.length === 0) {
      addToast('Silakan buat Kegiatan terlebih dahulu di menu Management Kegiatan.', 'warning');
      return;
    }
    if (souvenirs.length === 0) {
      addToast('Belum ada data souvenir. Silakan catat penerimaan Barang Masuk terlebih dahulu.', 'warning');
      return;
    }

    // Find first souvenir with currentStock > 0
    const firstWithStock = souvenirs.find((s) => getSouvenirStock(s.id).currentStock > 0) || souvenirs[0];
    const targetActivityId = actId || (activities.length > 0 ? activities[0].id : '');

    setEditingOut(null);
    setActivityId(targetActivityId);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setRepeaterItems([
      {
        souvenirId: firstWithStock?.id || '',
        quantity: 1,
        description: '',
      },
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openAddModal = () => openAddModalWithActivity();

  const openEditModal = (outHeader: InventoryOut) => {
    const items = inventoryOutItems
      .filter((it) => it.inventoryOutId === outHeader.id)
      .map((it) => ({
        id: it.id,
        souvenirId: it.souvenirId,
        quantity: it.quantity,
        description: it.description || '',
      }));

    setEditingOut(outHeader);
    setActivityId(outHeader.activityId);
    setDate(outHeader.date);
    setDescription(outHeader.description);
    setRepeaterItems(
      items.length > 0
        ? items
        : [{ souvenirId: souvenirs[0]?.id || '', quantity: 1, description: '' }]
    );
    setFormError('');
    setIsModalOpen(true);
  };

  // Repeater Handlers
  const handleAddRepeaterRow = () => {
    // Find first souvenir not already selected and with available stock
    const selectedIds = repeaterItems.map((r) => r.souvenirId);
    const nextAvailable =
      souvenirs.find(
        (s) => !selectedIds.includes(s.id) && getSouvenirStock(s.id, editingOut?.id).currentStock > 0
      ) || souvenirs.find((s) => !selectedIds.includes(s.id));

    if (!nextAvailable) {
      addToast('Semua jenis souvenir sudah dimasukkan ke dalam daftar.', 'info');
      return;
    }

    setRepeaterItems((prev) => [
      ...prev,
      { souvenirId: nextAvailable.id, quantity: 1, description: '' },
    ]);
  };

  const handleRemoveRepeaterRow = (index: number) => {
    if (repeaterItems.length <= 1) {
      addToast('Minimal harus terdapat 1 jenis souvenir dalam transaksi keluar.', 'warning');
      return;
    }
    setRepeaterItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRepeaterChange = (index: number, field: keyof RepeaterItem, value: any) => {
    setRepeaterItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'souvenirId') {
          const { currentStock } = getSouvenirStock(value, editingOut?.id);
          const currentQty = Number(updated.quantity) || 0;
          if (currentStock > 0) {
            if (currentQty > currentStock || currentQty <= 0) {
              updated.quantity = 1;
            }
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activityId) {
      setFormError('Kegiatan wajib dipilih.');
      return;
    }
    if (!date) {
      setFormError('Tanggal keluar wajib diisi.');
      return;
    }
    if (repeaterItems.length === 0) {
      setFormError('Minimal harus menambahkan 1 souvenir.');
      return;
    }

    // Check row items
    const parsedItems: { id?: string; souvenirId: string; quantity: number; description?: string }[] = [];
    for (let idx = 0; idx < repeaterItems.length; idx++) {
      const row = repeaterItems[idx];
      if (!row.souvenirId) {
        setFormError(`Baris #${idx + 1}: Pilih jenis souvenir.`);
        return;
      }
      const qty = Number(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        setFormError(`Baris #${idx + 1}: Jumlah pengeluaran harus lebih besar dari 0.`);
        return;
      }

      // Live stock check
      const { currentStock } = getSouvenirStock(row.souvenirId, editingOut ? editingOut.id : undefined);
      const souv = souvenirs.find((s) => s.id === row.souvenirId);
      if (currentStock <= 0) {
        setFormError(
          `Baris #${idx + 1}: Stok untuk "${souv?.name || 'Souvenir'}" saat ini KOSONG (0 ${souv?.unit || 'pcs'}).`
        );
        return;
      }
      if (qty > currentStock) {
        setFormError(
          `Baris #${idx + 1}: Stok tidak mencukupi untuk "${souv?.name || 'Souvenir'}". Permintaan ${qty} ${souv?.unit || 'pcs'}, namun stok tersedia hanya ${currentStock} ${souv?.unit || 'pcs'}.`
        );
        return;
      }

      parsedItems.push({
        id: row.id,
        souvenirId: row.souvenirId,
        quantity: qty,
        description: row.description,
      });
    }

    // Check duplicate souvenirs in list
    const ids = parsedItems.map((p) => p.souvenirId);
    if (new Set(ids).size !== ids.length) {
      setFormError('Terdapat jenis souvenir yang duplikat dalam form. Harap satukan jumlahnya pada 1 baris.');
      return;
    }

    if (editingOut) {
      const res = updateInventoryOut(
        editingOut.id,
        {
          activityId,
          date,
          description,
        },
        parsedItems
      );
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui transaksi.');
        return;
      }
    } else {
      const res = addInventoryOut(
        {
          activityId,
          date,
          description,
        },
        parsedItems
      );
      if (!res.success) {
        setFormError(res.message || 'Gagal menyimpan transaksi.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      const res = deleteInventoryOut(deleteTargetId);
      if (!res.success) {
        addToast(res.message || 'Gagal menghapus data barang keluar.', 'error');
      }
      setDeleteTargetId(null);
    }
  };

  return (
    <div id="inventory-out-view" className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-[#04457e]" />
            Pencatatan Barang Keluar (OUT)
          </h3>
        </div>

        <button
          id="btn-add-inventory-out"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Barang Keluar</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          {/* Left: Minimalist Search */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-out"
              type="text"
              placeholder="Cari kegiatan, PIC, catatan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-white shadow-2xs placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-md hover:bg-slate-100"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Symmetrical Minimalist Filter Icons & Counter */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {/* Minimalist Activity Filter Icon */}
              <div className="relative" ref={activityPopoverRef}>
                <button
                  id="btn-filter-activity-out"
                  type="button"
                  onClick={() => {
                    setIsActivityOpen(!isActivityOpen);
                    setIsDateOpen(false);
                  }}
                  title={
                    filterActivityId === 'ALL'
                      ? 'Filter Kegiatan'
                      : `Kegiatan: ${activities.find((a) => a.id === filterActivityId)?.name || ''}`
                  }
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                    filterActivityId !== 'ALL'
                      ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  {filterActivityId !== 'ALL' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                  )}
                </button>

                {/* Popover */}
                {isActivityOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <CalendarCheck className="w-3.5 h-3.5 text-[#04457e]" />
                        <span>Filter Kegiatan</span>
                      </div>
                      {filterActivityId !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterActivityId('ALL');
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterActivityId('ALL');
                          setCurrentPage(1);
                          setIsActivityOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          filterActivityId === 'ALL'
                            ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Semua Kegiatan ({activities.length})</span>
                        {filterActivityId === 'ALL' && <Check className="w-3.5 h-3.5 text-[#04457e]" />}
                      </button>
                      {activities.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setFilterActivityId(a.id);
                            setCurrentPage(1);
                            setIsActivityOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                            filterActivityId === a.id
                              ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-2">{a.name}</span>
                          {filterActivityId === a.id && (
                            <Check className="w-3.5 h-3.5 text-[#04457e] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimalist Date Range Filter Icon */}
              <div className="relative" ref={datePopoverRef}>
                <button
                  id="btn-filter-date-out"
                  type="button"
                  onClick={() => {
                    setIsDateOpen(!isDateOpen);
                    setIsActivityOpen(false);
                  }}
                  title={
                    filterStartDate || filterEndDate
                      ? `Rentang: ${filterStartDate || '...'} s/d ${filterEndDate || '...'}`
                      : 'Filter Periode Tanggal'
                  }
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                    filterStartDate || filterEndDate
                      ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {(filterStartDate || filterEndDate) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                  )}
                </button>

                {/* Date Popover */}
                {isDateOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-[#04457e]" />
                        <span>Filter Tanggal Keluar</span>
                      </div>
                      {(filterStartDate || filterEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterStartDate('');
                            setFilterEndDate('');
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Dari Tanggal
                        </label>
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => {
                            setFilterStartDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Sampai Tanggal
                        </label>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => {
                            setFilterEndDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-slate-50/50"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setFilterStartDate(today);
                            setFilterEndDate(today);
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                            setFilterStartDate(firstDay);
                            setFilterEndDate(lastDay);
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                        >
                          Bulan Ini
                        </button>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsDateOpen(false)}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-[#04457e] hover:bg-[#033460] transition-colors cursor-pointer text-center"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              {(searchTerm || filterActivityId !== 'ALL' || filterStartDate || filterEndDate) && (
                <button
                  id="btn-reset-out-filters"
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterActivityId('ALL');
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setCurrentPage(1);
                  }}
                  title="Reset Filter"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-xs font-bold text-slate-500 whitespace-nowrap pl-1">
              Total: {filteredList.length} Catatan Keluar
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table id="table-inventory-out" className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Kegiatan &amp; PIC</th>
                <th className="py-3 px-4">Tanggal Keluar</th>
                <th className="py-3 px-4">Daftar Souvenir Keluar</th>
                <th className="py-3 px-4 text-center">Total Item</th>
                <th className="py-3 px-4">Petugas / Keterangan</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ArrowUpFromLine className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    Belum ada transaksi pengeluaran barang.
                  </td>
                </tr>
              ) : (
                paginatedList.map((outHeader, idx) => {
                  const activity = activities.find((a) => a.id === outHeader.activityId);
                  const items = inventoryOutItems.filter((it) => it.inventoryOutId === outHeader.id);
                  const totalItems = items.reduce((acc, it) => acc + Number(it.quantity), 0);
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr
                      key={outHeader.id}
                      id={`row-out-${outHeader.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{globalIdx}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{activity?.name || 'Kegiatan Dihapus'}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">PIC: {activity?.pic || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatDateIndo(outHeader.date)}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          {items.slice(0, 3).map((it) => {
                            const souv = souvenirs.find((s) => s.id === it.souvenirId);
                            return (
                              <div key={it.id} className="text-xs text-slate-800 flex items-center justify-between">
                                <span className="font-medium truncate mr-2">• {souv?.name || 'Item'}:</span>
                                <span className="font-bold text-rose-600 flex-shrink-0">
                                  {it.quantity} {souv?.unit || 'pcs'}
                                </span>
                              </div>
                            );
                          })}
                          {items.length > 3 && (
                            <div className="text-[11px] text-slate-400 font-semibold">
                              +{items.length - 3} jenis souvenir lainnya...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80">
                          {totalItems} item
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        <div className="text-xs text-slate-700 truncate">{outHeader.description || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-detail-out-${outHeader.id}`}
                            onClick={() => setDetailOut(outHeader)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Transaksi Keluar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-out-${outHeader.id}`}
                            onClick={() => openEditModal(outHeader)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Transaksi Keluar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              id={`btn-delete-out-${outHeader.id}`}
                              onClick={() => setDeleteTargetId(outHeader.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Barang Keluar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal with DYNAMIC REPEATER for Multiple Souvenirs */}
      {isModalOpen && (
        <div
          id="modal-inventory-out"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-[#04457e]" />
                {editingOut ? 'Edit Transaksi Pengeluaran Barang' : 'Catat Barang Keluar untuk Kegiatan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {formError && (
                <div className="p-3.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Event & Date Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Kegiatan / Event <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-out-activity"
                    required
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                  >
                    <option value="" disabled>
                      -- Pilih Kegiatan / Event --
                    </option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name} (PIC: {act.pic})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pengeluaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-out-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Dynamic Repeater: Multiple Souvenirs in One Event */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Daftar Souvenir yang Dikeluarkan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Satu kegiatan dapat menggunakan lebih dari satu jenis souvenir.
                    </p>
                  </div>
                  <button
                    id="btn-add-repeater-row"
                    type="button"
                    onClick={handleAddRepeaterRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#04457e] bg-[#04457e]/5 hover:bg-[#04457e]/10 active:bg-[#04457e]/15 border border-[#04457e]/20 rounded-xl transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Souvenir</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {repeaterItems.map((row, index) => {
                    const { currentStock, status } = getSouvenirStock(
                      row.souvenirId,
                      editingOut ? editingOut.id : undefined
                    );
                    const selectedSouv = souvenirs.find((s) => s.id === row.souvenirId);
                    const isOverStock = Number(row.quantity) > currentStock;

                    return (
                      <div
                        key={index}
                        id={`repeater-row-${index}`}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isOverStock
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Souvenir Dropdown */}
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Jenis Souvenir #{index + 1}
                            </label>
                            <select
                              id={`select-repeater-souvenir-${index}`}
                              required
                              value={row.souvenirId}
                              onChange={(e) => handleRepeaterChange(index, 'souvenirId', e.target.value)}
                              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                            >
                              {souvenirs.map((s) => {
                                const cat = categories.find((c) => c.id === s.categoryId);
                                const st = getSouvenirStock(s.id, editingOut ? editingOut.id : undefined);
                                const isZero = st.currentStock <= 0;
                                const isSelected = row.souvenirId === s.id;
                                return (
                                  <option key={s.id} value={s.id} disabled={isZero && !isSelected}>
                                    {s.name} ({cat?.name || 'Kategori'} • {isZero ? 'STOK KOSONG (0)' : `Stok: ${st.currentStock} ${s.unit}`})
                                  </option>
                                );
                              })}
                            </select>

                            {/* Live Available Stock Badge under field */}
                            {selectedSouv && (
                              <div className="mt-1 flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500 font-medium">Stok Tersedia:</span>
                                <span
                                  className={`font-black ${
                                    currentStock === 0 ? 'text-rose-600' : 'text-emerald-700'
                                  }`}
                                >
                                  {currentStock} {selectedSouv.unit}
                                </span>
                                <StockBadge status={status} size="sm" />
                              </div>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Jumlah Keluar ({selectedSouv?.unit || 'pcs'})
                            </label>
                            <input
                              id={`input-repeater-qty-${index}`}
                              type="number"
                              min="1"
                              required
                              placeholder="1"
                              value={row.quantity}
                              onChange={(e) => handleRepeaterChange(index, 'quantity', e.target.value)}
                              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                                isOverStock
                                  ? 'border-rose-400 bg-rose-50 text-rose-800 focus:ring-rose-500/20'
                                  : 'border-slate-200 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white'
                              }`}
                            />
                            {isOverStock && (
                              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                Melebihi stok ({currentStock})!
                              </span>
                            )}
                          </div>

                          {/* Row Description & Delete */}
                          <div className="sm:col-span-3 flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Catatan Item
                              </label>
                              <input
                                id={`input-repeater-desc-${index}`}
                                type="text"
                                placeholder="Contoh: Paket VIP..."
                                value={row.description}
                                onChange={(e) => handleRepeaterChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                              />
                            </div>

                            {repeaterItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRepeaterRow(index)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mb-0.5 cursor-pointer"
                                title="Hapus Baris"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* General Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Umum
                </label>
                <textarea
                  id="input-out-general-desc"
                  rows={2}
                  placeholder="Contoh: untuk kebutuhan kegiatan sosialisasi."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800 resize-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-out-form"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingOut ? 'Simpan Perubahan' : 'Simpan Barang Keluar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Out Modal */}
      {detailOut && (
        <div
          id="modal-out-detail"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-[#04457e]" />
                Rincian Barang Keluar
              </h3>
              <button
                type="button"
                onClick={() => setDetailOut(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {(() => {
                const activity = activities.find((a) => a.id === detailOut.activityId);
                const items = inventoryOutItems.filter((it) => it.inventoryOutId === detailOut.id);
                const totalCount = items.reduce((acc, it) => acc + Number(it.quantity), 0);

                return (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Kegiatan:</span>
                        <span className="font-bold text-slate-900">{activity?.name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">PIC:</span>
                        <span className="font-semibold text-slate-800">{activity?.pic || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Tanggal Keluar:</span>
                        <span className="font-semibold text-slate-800">{formatDateIndo(detailOut.date)}</span>
                      </div>
                      {detailOut.description && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-slate-500 font-semibold block">Catatan:</span>
                          <span className="text-slate-700">{detailOut.description}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Souvenir Terdistribusi ({totalCount} item)
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[380px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                              <th className="py-2.5 px-3">Nama Souvenir</th>
                              <th className="py-2.5 px-3">Kategori</th>
                              <th className="py-2.5 px-3 text-right">Jumlah</th>
                              <th className="py-2.5 px-3">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {items.map((it) => {
                              const souv = souvenirs.find((s) => s.id === it.souvenirId);
                              const cat = categories.find((c) => c.id === souv?.categoryId);
                              return (
                                <tr key={it.id}>
                                  <td className="py-2 px-3 font-bold text-slate-900">{souv?.name || 'Item'}</td>
                                  <td className="py-2 px-3 text-slate-500">{cat?.name || '-'}</td>
                                  <td className="py-2 px-3 text-right font-black text-rose-600">
                                    {it.quantity} {souv?.unit || 'pcs'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-500">{it.description || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDetailOut(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Data Barang Keluar"
        message="Apakah Anda yakin ingin menghapus data pengeluaran barang ini? Seluruh stok souvenir yang sebelumnya dikeluarkan akan otomatis dikembalikan ke persediaan."
        confirmLabel="Hapus Data Barang"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
