import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  Boxes,
  CalendarCheck,
  Package,
  TrendingDown,
  Building2,
  User,
  MapPin,
  Eye,
  Tags,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import {
  exportActivityReportPDF,
  exportActivityReportExcel,
  exportItemDisbursementPDF,
  exportItemDisbursementExcel,
  ItemDisbursementData,
  formatDateIndo,
} from '../../utils/exportUtils';
import { Activity, Souvenir } from '../../types';

export const ReportsView: React.FC = () => {
  const {
    categories,
    activities,
    inventoryOut,
    inventoryOutItems,
    souvenirs,
    currentUser,
  } = useInventory();

  // Mode: 'activity' = Laporan Per Kegiatan, 'item' = Laporan Per Barang Keluar
  const [reportType, setReportType] = useState<'activity' | 'item'>('activity');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_YEAR' | 'THIS_MONTH' | 'CUSTOM'>('THIS_YEAR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  // Click outside listener for category & date popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail modal state
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<any | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<ItemDisbursementData | null>(null);

  // Date references
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  // Period label
  const periodText = useMemo(() => {
    if (periodFilter === 'THIS_YEAR') return `Tahun ${currentYear}`;
    if (periodFilter === 'THIS_MONTH') return `Bulan ${currentMonth}/${currentYear}`;
    if (periodFilter === 'CUSTOM') {
      return startDate || endDate ? `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` : 'Periode Kustom';
    }
    return 'Semua Periode';
  }, [periodFilter, currentYear, currentMonth, startDate, endDate]);

  // Helper date checker
  const isDateInFilter = (dateStr: string) => {
    if (!dateStr) return false;
    if (periodFilter === 'THIS_YEAR') return dateStr.startsWith(String(currentYear));
    if (periodFilter === 'THIS_MONTH') return dateStr.startsWith(`${currentYear}-${currentMonth}`);
    if (periodFilter === 'CUSTOM') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }
    return true;
  };

  // 1. DATA: REKAPITULASI PER KEGIATAN
  const filteredActivities = useMemo(() => {
    return activities
      .filter((act) => {
        const matchDate = isDateInFilter(act.activityDate);
        if (!matchDate) return false;

        const s = searchTerm.toLowerCase();
        const matchSearch =
          act.name.toLowerCase().includes(s) ||
          act.pic.toLowerCase().includes(s) ||
          (act.location || '').toLowerCase().includes(s);

        return matchSearch;
      })
      .map((act) => {
        const outList = inventoryOut.filter((o) => o.activityId === act.id);
        const outIds = outList.map((o) => o.id);
        const items = inventoryOutItems
          .filter((it) => outIds.includes(it.inventoryOutId))
          .map((it) => {
            const sv = souvenirs.find((s) => s.id === it.souvenirId);
            const cat = categories.find((c) => c.id === sv?.categoryId);
            return {
              ...it,
              souvenirName: sv?.name || 'Souvenir',
              categoryName: cat?.name || 'Kategori',
              categoryId: sv?.categoryId || '',
              unit: sv?.unit || 'pcs',
            };
          })
          .filter((it) => {
            if (selectedCategory === 'ALL') return true;
            return it.categoryId === selectedCategory;
          });

        const totalQty = items.reduce((acc, it) => acc + Number(it.quantity), 0);
        return {
          activity: act,
          items,
          totalQty,
        };
      })
      .filter((row) => {
        // If searching specifically for a souvenir name, match if items contain it
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchAct =
            row.activity.name.toLowerCase().includes(s) ||
            row.activity.pic.toLowerCase().includes(s) ||
            (row.activity.location || '').toLowerCase().includes(s);
          const matchItem = row.items.some((it) => it.souvenirName.toLowerCase().includes(s));
          return matchAct || matchItem;
        }
        return true;
      })
      .sort((a, b) => (b.activity.activityDate > a.activity.activityDate ? 1 : -1));
  }, [activities, inventoryOut, inventoryOutItems, souvenirs, categories, searchTerm, periodFilter, startDate, endDate, selectedCategory]);

  // 2. DATA: REKAPITULASI PER BARANG KELUAR
  const filteredItemDisbursements = useMemo(() => {
    const list: ItemDisbursementData[] = [];

    souvenirs.forEach((souv) => {
      const cat = categories.find((c) => c.id === souv.categoryId);
      if (selectedCategory !== 'ALL' && souv.categoryId !== selectedCategory) {
        return;
      }

      // Find all items out for this souvenir
      const relevantOutItems = inventoryOutItems.filter((it) => it.souvenirId === souv.id);
      let totalOut = 0;
      const activitiesList: ItemDisbursementData['activitiesList'] = [];

      relevantOutItems.forEach((it) => {
        const parentOut = inventoryOut.find((o) => o.id === it.inventoryOutId);
        if (!parentOut) return;

        const act = activities.find((a) => a.id === parentOut.activityId);
        const txDate = parentOut.date || act?.activityDate || '';

        if (!isDateInFilter(txDate)) return;

        totalOut += Number(it.quantity);
        activitiesList.push({
          activityName: act?.name || 'Kegiatan BI',
          date: txDate,
          pic: act?.pic || 'PIC',
          quantity: Number(it.quantity),
          description: it.description || act?.description || '',
        });
      });

      // Filter by search term
      const s = searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        souv.name.toLowerCase().includes(s) ||
        (cat?.name || '').toLowerCase().includes(s) ||
        activitiesList.some((a) => a.activityName.toLowerCase().includes(s) || a.pic.toLowerCase().includes(s));

      if (matchSearch) {
        list.push({
          souvenirId: souv.id,
          souvenirName: souv.name,
          categoryName: cat?.name || 'Umum',
          unit: souv.unit,
          totalOut,
          activitiesCount: activitiesList.length,
          activitiesList: activitiesList.sort((a, b) => (b.date > a.date ? 1 : -1)),
        });
      }
    });

    // Sort by totalOut descending
    return list.sort((a, b) => b.totalOut - a.totalOut);
  }, [souvenirs, categories, inventoryOutItems, inventoryOut, activities, periodFilter, startDate, endDate, selectedCategory, searchTerm]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (reportType === 'activity') {
      const totalOutQty = filteredActivities.reduce((acc, a) => acc + a.totalQty, 0);
      const activitiesWithItems = filteredActivities.filter((a) => a.totalQty > 0).length;
      const avgQty = activitiesWithItems > 0 ? Math.round(totalOutQty / activitiesWithItems) : 0;
      return {
        totalOut: totalOutQty,
        count: filteredActivities.length,
        activeCount: activitiesWithItems,
        avg: avgQty,
      };
    } else {
      const totalOutQty = filteredItemDisbursements.reduce((acc, it) => acc + it.totalOut, 0);
      const itemsWithOut = filteredItemDisbursements.filter((it) => it.totalOut > 0).length;
      return {
        totalOut: totalOutQty,
        count: filteredItemDisbursements.length,
        activeCount: itemsWithOut,
        avg: itemsWithOut > 0 ? Math.round(totalOutQty / itemsWithOut) : 0,
      };
    }
  }, [reportType, filteredActivities, filteredItemDisbursements]);

  // Total results & pagination
  const totalResults = reportType === 'activity' ? filteredActivities.length : filteredItemDisbursements.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const paginatedItemDisbursements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItemDisbursements.slice(start, start + pageSize);
  }, [filteredItemDisbursements, currentPage, pageSize]);

  // Exports
  const handleExportPDF = () => {
    if (reportType === 'activity') {
      exportActivityReportPDF(filteredActivities, {
        period: periodText,
        generatedBy: currentUser.name,
      });
    } else {
      exportItemDisbursementPDF(filteredItemDisbursements, {
        period: periodText,
        generatedBy: currentUser.name,
      });
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'activity') {
      exportActivityReportExcel(filteredActivities, {
        period: periodText,
        generatedBy: currentUser.name,
      });
    } else {
      exportItemDisbursementExcel(filteredItemDisbursements, {
        period: periodText,
        generatedBy: currentUser.name,
      });
    }
  };

  const handleExportSingleActivityPDF = (actData: any) => {
    exportActivityReportPDF([actData], {
      period: `Kegiatan: ${actData.activity.name}`,
      generatedBy: currentUser.name,
    });
  };

  const handleExportSingleItemPDF = (itemData: ItemDisbursementData) => {
    exportItemDisbursementPDF([itemData], {
      period: `Barang: ${itemData.souvenirName}`,
      generatedBy: currentUser.name,
    });
  };

  return (
    <div id="reporting-view-disbursements" className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Reporting Pengeluaran Souvenir
          </h2>
        </div>

        {/* Action Buttons: Tab Toggle + Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="btn-report-type-activity"
              onClick={() => {
                setReportType('activity');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportType === 'activity'
                  ? 'bg-[#04457e] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Per Kegiatan</span>
            </button>
            <button
              id="btn-report-type-item"
              onClick={() => {
                setReportType('item');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                reportType === 'item'
                  ? 'bg-[#04457e] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Per Barang Keluar</span>
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            id="btn-export-pdf-reporting"
            onClick={handleExportPDF}
            title={`Unduh Laporan ${reportType === 'activity' ? 'per Kegiatan' : 'per Barang Keluar'} format PDF`}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Unduh PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            id="btn-export-excel-reporting"
            onClick={handleExportExcel}
            title={`Unduh Laporan ${reportType === 'activity' ? 'per Kegiatan' : 'per Barang Keluar'} format Excel`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Souvenir Keluar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#04457e] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summaryMetrics.totalOut.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {reportType === 'activity' ? 'Kegiatan Terlayani' : 'Barang Terdistribusi'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              {reportType === 'activity' ? <CalendarCheck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summaryMetrics.activeCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rata-rata Distribusi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summaryMetrics.avg}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Periode</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 truncate">
            {periodText}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-reporting"
              type="text"
              placeholder={
                reportType === 'activity'
                  ? 'Cari kegiatan, PIC, lokasi, souvenir...'
                  : 'Cari barang, kategori, kegiatan...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              {/* Minimalist Category Filter Icon */}
              <div className="relative" ref={categoryPopoverRef}>
                <button
                  id="btn-filter-category-reporting"
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

                {/* Category Filter Popover */}
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
                          <span className="truncate">{c.name}</span>
                          {selectedCategory === c.id && <Check className="w-3.5 h-3.5 text-[#04457e]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimalist Date / Period Filter Icon */}
              <div className="relative" ref={datePopoverRef}>
                <button
                  id="btn-filter-date-reporting"
                  type="button"
                  onClick={() => setIsDateOpen(!isDateOpen)}
                  title={
                    periodFilter !== 'ALL' || startDate || endDate
                      ? `Periode: ${periodText}`
                      : 'Filter Periode / Tanggal'
                  }
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
                    periodFilter !== 'ALL' || startDate || endDate
                      ? 'bg-[#04457e] text-white border-[#04457e] shadow-sm ring-2 ring-[#04457e]/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {(periodFilter !== 'ALL' || startDate || endDate) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white ring-1 ring-amber-500" />
                  )}
                </button>

                {/* Date / Period Filter Popover */}
                {isDateOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-[#04457e]" />
                        <span>Filter Periode Tanggal</span>
                      </div>
                      {(periodFilter !== 'ALL' || startDate || endDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodFilter('ALL');
                            setStartDate('');
                            setEndDate('');
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Presets */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Pilihan Cepat
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPeriodFilter('THIS_YEAR');
                              setStartDate('');
                              setEndDate('');
                              setCurrentPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                              periodFilter === 'THIS_YEAR' && !startDate && !endDate
                                ? 'bg-[#04457e] text-white font-bold'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Tahun Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPeriodFilter('THIS_MONTH');
                              setStartDate('');
                              setEndDate('');
                              setCurrentPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                              periodFilter === 'THIS_MONTH' && !startDate && !endDate
                                ? 'bg-[#04457e] text-white font-bold'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Bulan Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setStartDate(today);
                              setEndDate(today);
                              setPeriodFilter('CUSTOM');
                              setCurrentPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                              periodFilter === 'CUSTOM' && startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0]
                                ? 'bg-[#04457e] text-white font-bold'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Hari Ini
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPeriodFilter('ALL');
                              setStartDate('');
                              setEndDate('');
                              setCurrentPage(1);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer ${
                              periodFilter === 'ALL' && !startDate && !endDate
                                ? 'bg-[#04457e] text-white font-bold'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Semua Periode
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Dari Tanggal
                        </label>
                        <input
                          id="input-reporting-date-start"
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setPeriodFilter('CUSTOM');
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
                          id="input-reporting-date-end"
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setPeriodFilter('CUSTOM');
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-slate-50/50"
                        />
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

              {/* Reset Filters Button */}
              {(searchTerm || selectedCategory !== 'ALL' || periodFilter !== 'ALL' || startDate || endDate) && (
                <button
                  id="btn-reset-reporting-filters"
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                    setPeriodFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  title="Reset Semua Filter"
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
              Total: {totalResults} {reportType === 'activity' ? 'Kegiatan' : 'Barang'}
            </span>
          </div>
        </div>

        {/* TABLE CONTENT */}
        {reportType === 'activity' ? (
          /* TAB 1: REKAPITULASI PER KEGIATAN */
          <div className="overflow-x-auto">
            <table id="table-report-activities" className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Kegiatan &amp; PIC</th>
                  <th className="py-3 px-4">Tanggal &amp; Lokasi</th>
                  <th className="py-3 px-4">Rincian Souvenir Keluar</th>
                  <th className="py-3 px-4 text-right">Total Volume</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarCheck className="w-9 h-9 text-slate-300" />
                        <p className="font-semibold text-slate-500">Tidak ada data kegiatan pada filter ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((row, idx) => {
                    const number = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={row.activity.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                          {number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{row.activity.name}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>PIC: {row.activity.pic}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-700">
                            {formatDateIndo(row.activity.activityDate)}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{row.activity.location || 'Makassar'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {row.items.length === 0 ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] text-slate-400 bg-slate-50 rounded-md border border-slate-100 italic">
                              Belum ada souvenir dicatat
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {row.items.slice(0, 3).map((it, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
                                  <span className="text-slate-700 font-medium truncate max-w-[200px]">
                                    • {it.souvenirName}
                                  </span>
                                  <span className="font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                                    +{it.quantity} {it.unit}
                                  </span>
                                </div>
                              ))}
                              {row.items.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedActivityDetail(row)}
                                  className="text-[10px] font-bold text-[#04457e] hover:underline cursor-pointer pt-0.5 block"
                                >
                                  +{row.items.length - 3} souvenir lainnya...
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                              row.totalQty > 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {row.totalQty} item
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedActivityDetail(row)}
                              title="Lihat Rincian Kegiatan"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#04457e] hover:bg-[#04457e]/10 active:bg-[#04457e]/20 transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportSingleActivityPDF(row)}
                              title="Unduh PDF Kegiatan Ini"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: REKAPITULASI PER BARANG KELUAR */
          <div className="overflow-x-auto">
            <table id="table-report-items" className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Barang / Souvenir</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Total Keluar</th>
                  <th className="py-3 px-4">Distribusi pada Agenda Kegiatan</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedItemDisbursements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-9 h-9 text-slate-300" />
                        <p className="font-semibold text-slate-500">Tidak ada data barang keluar pada filter ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItemDisbursements.map((row, idx) => {
                    const number = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={row.souvenirId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                          {number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{row.souvenirName}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {row.categoryName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                              row.totalOut > 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {row.totalOut.toLocaleString('id-ID')} {row.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {row.activitiesList.length === 0 ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] text-slate-400 bg-slate-50 rounded-md border border-slate-100 italic">
                              Belum pernah didistribusikan
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {row.activitiesList.slice(0, 2).map((act, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 text-[11px] py-0.5">
                                  <span className="text-slate-700 truncate max-w-[220px]">
                                    • {act.activityName} <span className="text-slate-400 text-[10px]">({formatDateIndo(act.date)})</span>
                                  </span>
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                                    {act.quantity} {row.unit}
                                  </span>
                                </div>
                              ))}
                              {row.activitiesList.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedItemDetail(row)}
                                  className="text-[10px] font-bold text-[#04457e] hover:underline cursor-pointer pt-0.5 block"
                                >
                                  +{row.activitiesList.length - 2} kegiatan lainnya...
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedItemDetail(row)}
                              title="Lihat Rincian Barang"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-[#04457e] hover:bg-[#04457e]/10 active:bg-[#04457e]/20 transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportSingleItemPDF(row)}
                              title="Unduh PDF Barang Ini"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Halaman <strong className="text-slate-800">{currentPage}</strong> dari{' '}
            <strong className="text-slate-800">{totalPages}</strong> ({totalResults} total data)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold transition-colors"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL: DETAIL KEGIATAN */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Rincian Pengeluaran Kegiatan
                </h4>
                <p className="text-xs text-slate-500">{selectedActivityDetail.activity.name}</p>
              </div>
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 font-medium">Tanggal:</span>
                  <p className="font-bold text-slate-800">
                    {formatDateIndo(selectedActivityDetail.activity.activityDate)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">PIC:</span>
                  <p className="font-bold text-slate-800">{selectedActivityDetail.activity.pic}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Lokasi:</span>
                  <p className="font-bold text-slate-800">
                    {selectedActivityDetail.activity.location || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total Souvenir:</span>
                  <p className="font-bold text-rose-600">{selectedActivityDetail.totalQty} item</p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2">Daftar Barang yang Keluar:</h5>
                {selectedActivityDetail.items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada souvenir yang dikeluarkan.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedActivityDetail.items.map((it: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{it.souvenirName}</div>
                          <div className="text-xs text-slate-500">{it.categoryName}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-rose-600">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => handleExportSingleActivityPDF(selectedActivityDetail)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Unduh PDF Kegiatan</span>
              </button>
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: DETAIL BARANG */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Rincian Distribusi Barang Keluar
                </h4>
                <p className="text-xs text-slate-500">{selectedItemDetail.souvenirName}</p>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 font-medium">Kategori:</span>
                  <p className="font-bold text-slate-800">{selectedItemDetail.categoryName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Satuan:</span>
                  <p className="font-bold text-slate-800">{selectedItemDetail.unit}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total Keluar:</span>
                  <p className="font-bold text-rose-600">
                    {selectedItemDetail.totalOut.toLocaleString('id-ID')} {selectedItemDetail.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Jumlah Kegiatan:</span>
                  <p className="font-bold text-slate-800">
                    {selectedItemDetail.activitiesCount} kegiatan
                  </p>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2">Alokasi ke Agenda Kegiatan:</h5>
                {selectedItemDetail.activitiesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum pernah dialokasikan ke kegiatan.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedItemDetail.activitiesList.map((act, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{act.activityName}</div>
                          <div className="text-xs text-slate-500">
                            {formatDateIndo(act.date)} • PIC: {act.pic}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-rose-600">
                            {act.quantity} {selectedItemDetail.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => handleExportSingleItemPDF(selectedItemDetail)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Unduh PDF Barang</span>
              </button>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
