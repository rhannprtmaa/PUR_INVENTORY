import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Eye,
  Boxes,
  Plus,
  X,
  FileText,
  FileSpreadsheet,
  Tags,
  Check,
  RotateCcw,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Souvenir, StockStatus } from '../../types';
import { StockBadge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { exportStockSummaryPDF, exportStockSummaryExcel } from '../../utils/exportUtils';

interface SouvenirsViewProps {
  onSelectSouvenirDetail: (souvenirId: string) => void;
}

const COMMON_UNITS = ['pcs', 'buah', 'box', 'set', 'paket', 'rim', 'lembar', 'lusin'];

export const SouvenirsView: React.FC<SouvenirsViewProps> = ({ onSelectSouvenirDetail }) => {
  const {
    souvenirs,
    categories,
    stockSummaries,
    addSouvenir,
    updateSouvenir,
    deleteSouvenir,
    isAdmin,
    currentUser,
    addToast,
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | StockStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Popover controls
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const statusPopoverRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSouvenir, setEditingSouvenir] = useState<Souvenir | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [customUnit, setCustomUnit] = useState('');
  const [minimumStock, setMinimumStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryPopoverRef.current && !categoryPopoverRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Summary Metrics
  const totalJenisSouvenir = souvenirs.length;
  const totalSisaStok = useMemo(
    () => stockSummaries.reduce((acc, it) => acc + it.currentStock, 0),
    [stockSummaries]
  );
  const totalMasuk = useMemo(
    () => stockSummaries.reduce((acc, it) => acc + it.totalIn, 0),
    [stockSummaries]
  );
  const totalKeluar = useMemo(
    () => stockSummaries.reduce((acc, it) => acc + it.totalOut, 0),
    [stockSummaries]
  );

  // Filtered Catalog
  const filteredSouvenirs = useMemo(() => {
    return stockSummaries.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.souvenir.name.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term) ||
        (item.souvenir.description || '').toLowerCase().includes(term) ||
        item.souvenir.unit.toLowerCase().includes(term);

      const matchCategory =
        selectedCategory === 'ALL' || item.souvenir.categoryId === selectedCategory;

      const matchStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [stockSummaries, searchTerm, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredSouvenirs.length / itemsPerPage) || 1;
  const paginatedSouvenirs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSouvenirs.slice(start, start + itemsPerPage);
  }, [filteredSouvenirs, currentPage]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setName('');
    setCategoryId(categories[0]?.id || '');
    setUnit('pcs');
    setCustomUnit('');
    setMinimumStock(10);
    setDescription('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (s: Souvenir) => {
    setEditingSouvenir(s);
    setName(s.name);
    setCategoryId(s.categoryId);
    if (COMMON_UNITS.includes(s.unit)) {
      setUnit(s.unit);
      setCustomUnit('');
    } else {
      setUnit('custom');
      setCustomUnit(s.unit);
    }
    setMinimumStock(s.minimumStock);
    setDescription(s.description || '');
    setFormError('');
  };

  // Save Add Souvenir
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama souvenir wajib diisi.');
      return;
    }
    if (!categoryId) {
      setFormError('Kategori wajib dipilih.');
      return;
    }
    const finalUnit = unit === 'custom' ? customUnit.trim() || 'pcs' : unit;

    const res = addSouvenir({
      name: name.trim(),
      categoryId,
      unit: finalUnit,
      minimumStock: Number(minimumStock) || 0,
      description: description.trim(),
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal menambahkan souvenir.');
      return;
    }

    addToast('Souvenir baru berhasil ditambahkan ke katalog.');
    setIsAddModalOpen(false);
  };

  // Save Edit Souvenir
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSouvenir) return;
    if (!name.trim()) {
      setFormError('Nama souvenir wajib diisi.');
      return;
    }
    if (!categoryId) {
      setFormError('Kategori wajib dipilih.');
      return;
    }
    const finalUnit = unit === 'custom' ? customUnit.trim() || 'pcs' : unit;

    const res = updateSouvenir(editingSouvenir.id, {
      name: name.trim(),
      categoryId,
      unit: finalUnit,
      minimumStock: Number(minimumStock) || 0,
      description: description.trim(),
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal memperbarui data souvenir.');
      return;
    }

    addToast('Data souvenir berhasil diperbarui.');
    setEditingSouvenir(null);
  };

  // Confirm Delete
  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      const res = deleteSouvenir(deleteTargetId);
      if (!res.success) {
        addToast(res.message || 'Gagal menghapus data souvenir.', 'error');
      } else {
        addToast('Data souvenir berhasil dihapus dari katalog.', 'success');
      }
      setDeleteTargetId(null);
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    exportStockSummaryPDF(stockSummaries, {
      period: 'Sisa Stok Real-Time',
      generatedBy: currentUser.name,
    });
  };

  const handleExportExcel = () => {
    exportStockSummaryExcel(stockSummaries, {
      period: 'Sisa Stok Real-Time',
      generatedBy: currentUser.name,
    });
  };

  const hasActiveFilter = searchTerm !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  return (
    <div id="souvenirs-view-container" className="space-y-6 pb-12">
      {/* 4 Metric Summary Cards */}
      <div id="catalog-metrics-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Jenis */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Souvenir</div>
            <div className="text-xl font-black text-slate-900">{totalJenisSouvenir} Item</div>
          </div>
        </div>

        {/* Card 2: Total Sisa Stok */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Stok Tersedia</div>
            <div className="text-xl font-black text-slate-900">{totalSisaStok.toLocaleString('id-ID')} Unit</div>
          </div>
        </div>

        {/* Card 3: Total Masuk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mutasi Masuk</div>
            <div className="text-xl font-black text-emerald-700">+{totalMasuk.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Card 4: Total Keluar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mutasi Keluar</div>
            <div className="text-xl font-black text-amber-700">-{totalKeluar.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#04457e]" />
            Katalog &amp; Sisa Stok Souvenir
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog seluruh souvenir, monitoring sisa stok, dan riwayat persediaan souvenir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* PDF Export */}
          <button
            id="btn-download-stock-pdf"
            onClick={handleExportPDF}
            title="Unduh rekapitulasi sisa stok persediaan dalam format PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Unduh PDF</span>
          </button>

          {/* Excel Export */}
          <button
            id="btn-download-stock-excel"
            onClick={handleExportExcel}
            title="Unduh rekapitulasi sisa stok persediaan dalam format Excel (.xlsx)"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table Card with Minimalist Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          {/* Left: Minimalist Search */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-souvenirs"
              type="text"
              placeholder="Cari souvenir, satuan, kategori..."
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
              {/* Minimalist Category Filter Icon */}
              <div className="relative" ref={categoryPopoverRef}>
                <button
                  id="btn-filter-category-souvenirs"
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  title={
                    selectedCategory === 'ALL'
                      ? 'Filter Kategori'
                      : `Kategori: ${categories.find((c) => c.id === selectedCategory)?.name || ''}`
                  }
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                    selectedCategory !== 'ALL'
                      ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Tags className="w-4 h-4" />
                  {selectedCategory !== 'ALL' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                  )}
                </button>

                {/* Category Popover */}
                {isCategoryOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Tags className="w-3.5 h-3.5 text-[#04457e]" />
                        <span>Filter Kategori</span>
                      </div>
                      {selectedCategory !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('ALL');
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
                          setSelectedCategory('ALL');
                          setCurrentPage(1);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          selectedCategory === 'ALL'
                            ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Semua Kategori</span>
                        {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-[#04457e]" />}
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(c.id);
                            setCurrentPage(1);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                            selectedCategory === c.id
                              ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-2">{c.name}</span>
                          {selectedCategory === c.id && (
                            <Check className="w-3.5 h-3.5 text-[#04457e] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimalist Status Filter Icon */}
              <div className="relative" ref={statusPopoverRef}>
                <button
                  id="btn-filter-status-souvenirs"
                  type="button"
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  title={
                    selectedStatus === 'ALL'
                      ? 'Filter Status Stok'
                      : `Status: ${selectedStatus}`
                  }
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                    selectedStatus !== 'ALL'
                      ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {selectedStatus !== 'ALL' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                  )}
                </button>

                {/* Status Popover */}
                {isStatusOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Filter className="w-3.5 h-3.5 text-[#04457e]" />
                        <span>Status Stok</span>
                      </div>
                      {selectedStatus !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStatus('ALL');
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(['ALL', 'Aman', 'Menipis', 'Habis'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setSelectedStatus(status);
                            setCurrentPage(1);
                            setIsStatusOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                            selectedStatus === status
                              ? 'bg-[#04457e]/10 text-[#04457e] font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{status === 'ALL' ? 'Semua Status' : `Stok ${status}`}</span>
                          {selectedStatus === status && (
                            <Check className="w-3.5 h-3.5 text-[#04457e] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filter Button */}
              {hasActiveFilter && (
                <button
                  id="btn-reset-souvenirs-filter"
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
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
              Total: {filteredSouvenirs.length} Souvenir
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table id="table-souvenirs-catalog" className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Souvenir</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Total Masuk</th>
                <th className="py-3 px-4 text-right">Total Keluar</th>
                <th className="py-3 px-4 text-right">Sisa Stok</th>
                <th className="py-3 px-4 text-center">Status Stok</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {paginatedSouvenirs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    Belum ada data barang souvenir yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                paginatedSouvenirs.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={item.souvenir.id}
                      id={`row-souv-catalog-${item.souvenir.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{globalIdx}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.souvenir.name}</div>
                        {item.souvenir.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {item.souvenir.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {item.categoryName || item.category?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        +{item.totalIn} {item.souvenir.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                        -{item.totalOut} {item.souvenir.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-slate-900">{item.currentStock}</span>{' '}
                        <span className="text-[11px] text-slate-500">{item.souvenir.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StockBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-view-detail-souv-${item.souvenir.id}`}
                            onClick={() => onSelectSouvenirDetail(item.souvenir.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Riwayat Souvenir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                id={`btn-edit-souv-${item.souvenir.id}`}
                                onClick={() => handleOpenEditModal(item.souvenir)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Info Souvenir"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                id={`btn-del-souv-${item.souvenir.id}`}
                                onClick={() => setDeleteTargetId(item.souvenir.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Souvenir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Souvenir Modal */}
      {isAddModalOpen && (
        <div
          id="modal-add-souvenir"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#04457e]" />
                <h3 className="text-sm font-bold text-slate-900">Tambah Souvenir Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Souvenir / Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pulpen Metal BI, Tumbler Custom..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Satuan Barang <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                        <option value="custom">Lainnya...</option>
                      </select>

                      {unit === 'custom' && (
                        <input
                          type="text"
                          placeholder="Satuan..."
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-1/2 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Stok Minimum <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem akan menandai status "Stok Menipis" jika persediaan &le; batas ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Spesifikasi Barang
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Bahan stainless steel 304, kemasan box satin..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Simpan Souvenir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Souvenir Modal */}
      {editingSouvenir && (
        <div
          id="modal-edit-souvenir"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#04457e]" />
                <h3 className="text-sm font-bold text-slate-900">Edit Data Souvenir</h3>
              </div>
              <button
                onClick={() => setEditingSouvenir(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Souvenir / Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pulpen Metal BI, Tumbler Custom..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Satuan Barang <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                        <option value="custom">Lainnya...</option>
                      </select>

                      {unit === 'custom' && (
                        <input
                          type="text"
                          placeholder="Satuan..."
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-1/2 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Stok Minimum <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem akan menandai status "Stok Menipis" jika persediaan &le; batas ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Spesifikasi Barang
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Bahan stainless steel 304, kemasan box satin..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSouvenir(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Data Souvenir"
        message="Apakah Anda yakin ingin menghapus data souvenir ini dari katalog? Souvenir yang telah memiliki riwayat transaksi barang masuk atau keluar tidak dapat dihapus demi integritas data persediaan."
        confirmLabel="Hapus Souvenir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

