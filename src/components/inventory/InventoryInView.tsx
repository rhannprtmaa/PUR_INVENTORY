import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Boxes,
  X,
  FileText,
  FileSpreadsheet,
  Tags,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryIn } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  formatDateIndo,
  exportTransactionHistoryPDF,
  exportTransactionHistoryExcel,
} from '../../utils/exportUtils';

interface InventoryInViewProps {
  onSelectSouvenirDetail: (souvenirId: string) => void;
}

export const InventoryInView: React.FC<InventoryInViewProps> = ({ onSelectSouvenirDetail }) => {
  const {
    inventoryIn,
    souvenirs,
    categories,
    addInventoryIn,
    updateInventoryIn,
    deleteInventoryIn,
    addSouvenir,
    updateSouvenir,
    isAdmin,
    stockSummaries,
    currentUser,
    addToast,
  } = useInventory();

  // Filters for Transactions
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Minimalist Popovers State & Click-outside Handling
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryPopoverRef.current && !categoryPopoverRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
      if (datePopoverRef.current && !datePopoverRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryIn | null>(null);

  // Form State for Barang Masuk
  const [souvenirName, setSouvenirName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('pcs');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number | string>(50);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Target ID
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Auto-detect matched souvenir by typed name
  const matchedSouvenir = useMemo(() => {
    if (!souvenirName.trim()) return null;
    return (
      souvenirs.find(
        (s) => s.name.trim().toLowerCase() === souvenirName.trim().toLowerCase()
      ) || null
    );
  }, [souvenirs, souvenirName]);

  const matchedStockSummary = useMemo(() => {
    if (!matchedSouvenir) return null;
    return stockSummaries.find((s) => s.souvenir.id === matchedSouvenir.id) || null;
  }, [matchedSouvenir, stockSummaries]);

  // Derived filtered transactions list
  const filteredTransactions = useMemo(() => {
    return inventoryIn.filter((item) => {
      const souv = souvenirs.find((s) => s.id === item.souvenirId);
      const cat = categories.find((c) => c.id === (souv?.categoryId || item.categoryId));
      const souvName = souv?.name || '';
      const catName = cat?.name || '';
      const desc = item.description || '';

      const matchSearch =
        souvName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = filterCategory === 'ALL' || (souv?.categoryId === filterCategory || item.categoryId === filterCategory);

      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && item.date >= filterStartDate;
      }
      if (filterEndDate) {
        matchDate = matchDate && item.date <= filterEndDate;
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [inventoryIn, souvenirs, categories, searchTerm, filterCategory, filterStartDate, filterEndDate]);

  // Pagination calculation for Transactions
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Aggregate Metrics
  const totalUnitMasuk = useMemo(() => {
    return inventoryIn.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  }, [inventoryIn]);

  const totalSisaStok = useMemo(() => {
    return stockSummaries.reduce((sum, it) => sum + it.currentStock, 0);
  }, [stockSummaries]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setSouvenirName('');
    setSelectedCategory(categories[0]?.id || '');
    setSelectedUnit('pcs');
    setDate(new Date().toISOString().split('T')[0]);
    setQuantity(50);
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Transaction Modal
  const openEditModal = (item: InventoryIn) => {
    setEditingItem(item);
    const existing = souvenirs.find((s) => s.id === item.souvenirId);
    setSouvenirName(existing?.name || '');
    setSelectedCategory(existing?.categoryId || item.categoryId || categories[0]?.id || '');
    setSelectedUnit(existing?.unit || 'pcs');
    setDate(item.date);
    setQuantity(item.quantity);
    setDescription(item.description);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle typed souvenir name with auto-select category if matched
  const handleSouvenirNameChange = (val: string) => {
    setSouvenirName(val);
    const clean = val.trim().toLowerCase();
    const found = souvenirs.find((s) => s.name.trim().toLowerCase() === clean);
    if (found) {
      setSelectedCategory(found.categoryId);
      setSelectedUnit(found.unit);
    }
  };

  // Submit Barang Masuk
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = souvenirName.trim();
    if (!cleanName) {
      setFormError('Nama souvenir / barang wajib diisi.');
      return;
    }
    if (!selectedCategory) {
      setFormError('Pilih kategori souvenir dari dropdown.');
      return;
    }
    if (!date) {
      setFormError('Tanggal penerimaan barang masuk wajib diisi.');
      return;
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Jumlah barang masuk harus berupa angka positif lebih dari 0.');
      return;
    }

    let targetSouvenirId = '';
    const finalUnit = selectedUnit.trim() || 'pcs';

    // Check if typed name matches an existing souvenir
    const existing = souvenirs.find(
      (s) => s.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (existing) {
      targetSouvenirId = existing.id;
      // Sync category and unit if user selected a different category or unit
      if (existing.categoryId !== selectedCategory || existing.unit !== finalUnit) {
        updateSouvenir(existing.id, {
          categoryId: selectedCategory,
          unit: finalUnit,
        });
      }
    } else {
      // Auto-register new souvenir on the fly with the chosen category
      const souvRes = addSouvenir({
        name: cleanName,
        categoryId: selectedCategory,
        unit: finalUnit,
        minimumStock: 10,
        description: description ? `Pengadaan: ${description}` : 'Pencatatan pertama dari Barang Masuk',
      });

      if (!souvRes.success || !souvRes.id) {
        setFormError(souvRes.message || 'Gagal mendaftarkan souvenir baru.');
        return;
      }
      targetSouvenirId = souvRes.id;
    }

    if (editingItem) {
      const res = updateInventoryIn(editingItem.id, {
        souvenirId: targetSouvenirId,
        categoryId: selectedCategory,
        date,
        quantity: qty,
        description,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui data barang masuk.');
        return;
      }
    } else {
      const res = addInventoryIn({
        souvenirId: targetSouvenirId,
        categoryId: selectedCategory,
        date,
        quantity: qty,
        description,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal menyimpan data barang masuk.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  // Delete Transaction Confirm
  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      const res = deleteInventoryIn(deleteTargetId);
      if (!res.success) {
        addToast(res.message || 'Gagal menghapus data barang masuk.', 'error');
      } else {
        addToast('Data barang masuk berhasil dihapus.', 'success');
      }
      setDeleteTargetId(null);
    }
  };

  // Export Transactions PDF
  const handleExportTransactionsPDF = () => {
    const txItems = filteredTransactions.map((item) => {
      const souv = souvenirs.find((s) => s.id === item.souvenirId);
      const cat = categories.find((c) => c.id === (souv?.categoryId || item.categoryId));
      return {
        id: item.id,
        date: item.date,
        type: 'IN' as const,
        souvenirId: item.souvenirId,
        souvenirName: souv?.name || '-',
        categoryName: cat?.name || '-',
        quantity: item.quantity,
        unit: souv?.unit || 'pcs',
        user: item.createdBy || currentUser.name,
        description: item.description || '',
        createdAt: item.createdAt,
        originalTxId: item.id,
      };
    });

    exportTransactionHistoryPDF(txItems, {
      period: 'Laporan Riwayat Barang Masuk',
      generatedBy: currentUser.name,
    });
  };

  // Export Transactions Excel
  const handleExportTransactionsExcel = () => {
    const txItems = filteredTransactions.map((item) => {
      const souv = souvenirs.find((s) => s.id === item.souvenirId);
      const cat = categories.find((c) => c.id === (souv?.categoryId || item.categoryId));
      return {
        id: item.id,
        date: item.date,
        type: 'IN' as const,
        souvenirId: item.souvenirId,
        souvenirName: souv?.name || '-',
        categoryName: cat?.name || '-',
        quantity: item.quantity,
        unit: souv?.unit || 'pcs',
        user: item.createdBy || currentUser.name,
        description: item.description || '',
        createdAt: item.createdAt,
        originalTxId: item.id,
      };
    });

    exportTransactionHistoryExcel(txItems, {
      period: 'Laporan Riwayat Barang Masuk',
      generatedBy: currentUser.name,
    });
  };

  return (
    <div id="inventory-in-view" className="space-y-6 pb-12">
      {/* 4 Metric Summary Cards */}
      <div id="in-metrics-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Jenis Souvenir</div>
            <div className="text-xl font-black text-slate-900">{souvenirs.length} Item</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Catatan Masuk</div>
            <div className="text-xl font-black text-slate-900">{inventoryIn.length} Kali</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Unit Masuk</div>
            <div className="text-xl font-black text-slate-900">+{totalUnitMasuk}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Sisa Stok Tersedia</div>
            <div className="text-xl font-black text-slate-900">{totalSisaStok} Unit</div>
          </div>
        </div>
      </div>

      {/* Top Banner with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-[#04457e]" />
            Pencatatan Barang Masuk (Inventory In)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan penerimaan barang souvenir dan riwayat masuk persediaan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Buttons */}
          <button
            id="btn-download-tx-pdf-in"
            onClick={handleExportTransactionsPDF}
            title="Unduh rekapitulasi riwayat barang masuk dalam format PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Unduh PDF</span>
          </button>

          <button
            id="btn-download-tx-excel-in"
            onClick={handleExportTransactionsExcel}
            title="Unduh rekapitulasi riwayat barang masuk dalam format Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh Excel</span>
          </button>

          {/* Add New Entry Button */}
          <button
            id="btn-add-inventory-in"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Barang Masuk</span>
          </button>
        </div>
      </div>

      {/* Table Section: Riwayat Transaksi Masuk */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filters Toolbar */}
          <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            {/* Left: Minimalist Search */}
            <div className="relative w-full sm:w-72 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-search-in"
                type="text"
                placeholder="Cari souvenir, pengadaan..."
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

            {/* Right: Symmetrical Minimalist Filter Icons & Record Counter */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                {/* Minimalist Category Filter Icon */}
                <div className="relative" ref={categoryPopoverRef}>
                  <button
                    id="btn-filter-category-in"
                    type="button"
                    onClick={() => {
                      setIsCategoryOpen(!isCategoryOpen);
                      setIsDateOpen(false);
                    }}
                    title={
                      filterCategory === 'ALL'
                        ? 'Filter Kategori'
                        : `Kategori: ${categories.find((c) => c.id === filterCategory)?.name || ''}`
                    }
                    className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                      filterCategory !== 'ALL'
                        ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                    }`}
                  >
                    <Tags className="w-4 h-4" />
                    {filterCategory !== 'ALL' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                    )}
                  </button>

                  {/* Category Filter Popover */}
                  {isCategoryOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Tags className="w-3.5 h-3.5 text-[#04457e]" />
                          <span>Filter Kategori</span>
                        </div>
                        {filterCategory !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterCategory('ALL');
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
                            setFilterCategory('ALL');
                            setCurrentPage(1);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                            filterCategory === 'ALL'
                              ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Semua Kategori</span>
                          {filterCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-[#04457e]" />}
                        </button>
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setFilterCategory(c.id);
                              setCurrentPage(1);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                              filterCategory === c.id
                                ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate pr-2">{c.name}</span>
                            {filterCategory === c.id && (
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
                    id="btn-filter-date-in"
                    type="button"
                    onClick={() => {
                      setIsDateOpen(!isDateOpen);
                      setIsCategoryOpen(false);
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

                  {/* Date Filter Popover */}
                  {isDateOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-4 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-[#04457e]" />
                          <span>Filter Tanggal Masuk</span>
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

                {/* Reset Filters Button (Visible only when filters active) */}
                {(searchTerm || filterCategory !== 'ALL' || filterStartDate || filterEndDate) && (
                  <button
                    id="btn-reset-in-filters"
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('ALL');
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

              {/* Total Records Counter */}
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap pl-1">
                Total: {filteredTransactions.length} Catatan Masuk
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table id="table-inventory-in" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">No</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tanggal Masuk</th>
                  <th className="py-3 px-4 text-right">Jumlah Masuk</th>
                  <th className="py-3 px-4">Keterangan / Pengadaan</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <ArrowDownToLine className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                      Belum ada data riwayat barang masuk.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((item, idx) => {
                    const souv = souvenirs.find((s) => s.id === item.souvenirId);
                    const cat = categories.find((c) => c.id === (souv?.categoryId || item.categoryId));
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <tr
                        key={item.id}
                        id={`row-in-${item.id}`}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{globalIdx}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{souv ? souv.name : 'Barang Dihapus'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {cat ? cat.name : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {formatDateIndo(item.date)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-sm font-black text-emerald-600">+{item.quantity}</span>{' '}
                          <span className="text-[11px] text-slate-500">{souv?.unit || 'pcs'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          {item.description || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {souv && (
                              <button
                                id={`btn-detail-in-${item.id}`}
                                onClick={() => onSelectSouvenirDetail(souv.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail Souvenir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              id={`btn-edit-in-${item.id}`}
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Barang Masuk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                id={`btn-delete-in-${item.id}`}
                                onClick={() => setDeleteTargetId(item.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data Barang Masuk"
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari{' '}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-prev-page-in"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-next-page-in"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>



      {/* MODAL INPUT / EDIT TRANSAKSI BARANG MASUK */}
      {isModalOpen && (
        <div
          id="modal-inventory-in"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-[#04457e]" />
                {editingItem ? 'Edit Data Barang Masuk' : 'Input Penerimaan Barang Masuk'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                    {formError}
                  </div>
                )}

                {/* Field 1: Nama Souvenir / Barang */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-souvenir-name" className="block text-xs font-bold text-slate-700">
                      Nama Souvenir / Barang <span className="text-rose-500">*</span>
                    </label>
                    {matchedSouvenir && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terdaftar (Stok: {matchedStockSummary?.currentStock || 0} {matchedSouvenir.unit})
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="input-souvenir-name"
                      type="text"
                      list="souvenirs-datalist"
                      required
                      placeholder="Ketik nama barang / pilih dari daftar (contoh: Tumbler BI, Tas Spunbond)..."
                      value={souvenirName}
                      onChange={(e) => handleSouvenirNameChange(e.target.value)}
                      autoComplete="off"
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800 placeholder:text-slate-400"
                    />
                    <datalist id="souvenirs-datalist">
                      {souvenirs.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Field 2: Kategori Souvenir (Dropdown - Selalu Muncul) */}
                <div>
                  <label htmlFor="input-category-in-form" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Tags className="w-3.5 h-3.5 text-[#04457e]" />
                    <span>Kategori Souvenir</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="input-category-in-form"
                    required
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Kategori Souvenir --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kategori diambil dari master Kategori Souvenir.
                  </p>
                </div>

                {/* Field 3 & 4: Satuan & Tanggal Masuk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Satuan Barang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-unit-in-form"
                      type="text"
                      required
                      placeholder="pcs / buah / rim / box"
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Masuk <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-date-in-form"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Field 5: Jumlah Masuk */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Barang Masuk ({selectedUnit || 'pcs'}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-qty-in-form"
                    type="number"
                    min="1"
                    required
                    placeholder="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                  />
                </div>

                {/* Field 6: Keterangan / Sumber Pengadaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Pengadaan / Sumber Barang
                  </label>
                  <textarea
                    id="input-desc-in-form"
                    rows={3}
                    placeholder="Contoh: Pengadaan Batch II dari CV Percetakan Mandiri, Surat Jalan #SJ-2026-08..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] resize-none bg-white text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-in-form"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Catat Barang Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Data Barang Masuk"
        message="Apakah Anda yakin ingin menghapus data penerimaan barang masuk ini? Sisa stok persediaan barang akan otomatis disesuaikan kembali."
        confirmLabel="Hapus Data Barang"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
