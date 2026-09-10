import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  Edit2,
  Trash2,
  Eye,
  Boxes,
  ArrowUpFromLine,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Activity } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDateIndo } from '../../utils/exportUtils';
import { ActiveTab } from '../layout/Sidebar';

interface ActivitiesViewProps {
  onDirectToBarangKeluar?: (activityId: string) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  isAddModalAutoOpen?: boolean;
  onCloseAddModalAutoOpen?: () => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  onDirectToBarangKeluar,
  setActiveTab,
  isAddModalAutoOpen,
  onCloseAddModalAutoOpen,
}) => {
  const {
    activities,
    inventoryOut,
    inventoryOutItems,
    souvenirs,
    categories,
    addActivity,
    updateActivity,
    deleteActivity,
    isAdmin,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(isAddModalAutoOpen || false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [pic, setPic] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Detail Modal State
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Click outside listener for date popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePopoverRef.current && !datePopoverRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync if prop changed
  React.useEffect(() => {
    if (isAddModalAutoOpen) {
      openAddModal();
    }
  }, [isAddModalAutoOpen]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchSearch =
        act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && act.activityDate >= filterStartDate;
      }
      if (filterEndDate) {
        matchDate = matchDate && act.activityDate <= filterEndDate;
      }

      return matchSearch && matchDate;
    });
  }, [activities, searchTerm, filterStartDate, filterEndDate]);

  const openAddModal = () => {
    setEditingActivity(null);
    setName('');
    setPic('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setName(act.name);
    setPic(act.pic);
    setActivityDate(act.activityDate);
    setLocation(act.location);
    setDescription(act.description);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onCloseAddModalAutoOpen) {
      onCloseAddModalAutoOpen();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama kegiatan wajib diisi.');
      return;
    }
    if (!pic.trim()) {
      setFormError('PIC kegiatan wajib diisi.');
      return;
    }
    if (!activityDate) {
      setFormError('Tanggal kegiatan wajib diisi.');
      return;
    }

    if (editingActivity) {
      const res = updateActivity(editingActivity.id, {
        name,
        pic,
        activityDate,
        location,
        description,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui kegiatan.');
        return;
      }
    } else {
      const res = addActivity({
        name,
        pic,
        activityDate,
        location,
        description,
      });
      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan kegiatan.');
        return;
      }
    }

    closeModal();
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      const res = deleteActivity(deleteTargetId);
      if (!res.success) {
        alert(res.message);
      }
      setDeleteTargetId(null);
    }
  };

  // Compute Souvenirs assigned to selected activity for detail view
  const activityDistributedSouvenirs = useMemo(() => {
    if (!detailActivity) return { items: [], totalCount: 0 };
    const relatedOuts = inventoryOut.filter((o) => o.activityId === detailActivity.id).map((o) => o.id);
    const relatedItems = inventoryOutItems.filter((it) => relatedOuts.includes(it.inventoryOutId));

    const items = relatedItems.map((it) => {
      const souv = souvenirs.find((s) => s.id === it.souvenirId);
      const cat = categories.find((c) => c.id === souv?.categoryId);
      return {
        id: it.id,
        souvenirName: souv ? souv.name : 'Souvenir',
        categoryName: cat ? cat.name : '-',
        quantity: it.quantity,
        unit: souv?.unit || 'pcs',
        description: it.description,
      };
    });

    const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);
    return { items, totalCount };
  }, [detailActivity, inventoryOut, inventoryOutItems, souvenirs, categories]);

  return (
    <div id="activities-view-container" className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#04457e]" />
            Management Kegiatan / Event
          </h3>
        </div>

        <button
          id="btn-add-activity-modal-trigger"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          {/* Left: Minimalist Search */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-activities"
              type="text"
              placeholder="Cari kegiatan, PIC, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-white shadow-2xs placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
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
              {/* Minimalist Date Range Filter Icon */}
              <div className="relative" ref={datePopoverRef}>
                <button
                  id="btn-filter-date-activity"
                  type="button"
                  onClick={() => setIsDateOpen(!isDateOpen)}
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
                        <span>Filter Tanggal Kegiatan</span>
                      </div>
                      {(filterStartDate || filterEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterStartDate('');
                            setFilterEndDate('');
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
                          id="input-activity-date-start"
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Sampai Tanggal
                        </label>
                        <input
                          id="input-activity-date-end"
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
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
              {(searchTerm || filterStartDate || filterEndDate) && (
                <button
                  id="btn-reset-activity-filters"
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStartDate('');
                    setFilterEndDate('');
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
              Total: {filteredActivities.length} Kegiatan
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table id="table-activities" className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Kegiatan</th>
                <th className="py-3 px-4">PIC / Tim Pelaksana</th>
                <th className="py-3 px-4">Tanggal Kegiatan</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4 text-center">Souvenir Terdistribusi</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                    Belum ada kegiatan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, idx) => {
                  const relatedOuts = inventoryOut.filter((o) => o.activityId === act.id).map((o) => o.id);
                  const relatedItems = inventoryOutItems.filter((it) => relatedOuts.includes(it.inventoryOutId));
                  const totalItems = relatedItems.reduce((sum, it) => sum + Number(it.quantity), 0);

                  return (
                    <tr
                      key={act.id}
                      id={`row-activity-${act.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{act.name}</div>
                        {act.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{act.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                          <User className="w-3.5 h-3.5 text-[#04457e]" /> {act.pic}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {formatDateIndo(act.activityDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> {act.location || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            totalItems > 0
                              ? 'bg-sky-50 text-sky-800 border border-sky-200/80'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Boxes className="w-3 h-3" />
                          {totalItems} item ({relatedItems.length} jenis)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-detail-activity-${act.id}`}
                            onClick={() => setDetailActivity(act)}
                            className="p-1.5 text-[#04457e] hover:bg-[#04457e]/10 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Souvenir Kegiatan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onDirectToBarangKeluar && (
                            <button
                              id={`btn-out-activity-${act.id}`}
                              onClick={() => onDirectToBarangKeluar(act.id)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Catat Pengeluaran Souvenir Kegiatan Ini"
                            >
                              <ArrowUpFromLine className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            id={`btn-edit-activity-${act.id}`}
                            onClick={() => openEditModal(act)}
                            className="p-1.5 text-slate-600 hover:text-[#04457e] hover:bg-[#04457e]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kegiatan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              id={`btn-delete-activity-${act.id}`}
                              onClick={() => setDeleteTargetId(act.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kegiatan"
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
      </div>

      {/* Add / Edit Activity Modal */}
      {isModalOpen && (
        <div
          id="modal-activity"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#04457e]" />
                {editingActivity ? 'Edit Informasi Kegiatan' : 'Tambah Kegiatan / Event Baru'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-activity-name"
                    type="text"
                    required
                    placeholder="Contoh: Sosialisasi CBP Rupiah..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIC / Tim Penanggung Jawab <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-activity-pic"
                      type="text"
                      required
                      placeholder="Contoh: Kak Raihan..."
                      value={pic}
                      onChange={(e) => setPic(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-activity-date"
                      type="date"
                      required
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi / Tempat Acara
                  </label>
                  <input
                    id="input-activity-location"
                    type="text"
                    placeholder="Contoh: Ballroom Hotel Claro Makassar..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Kegiatan
                  </label>
                  <textarea
                    id="input-activity-desc"
                    rows={3}
                    placeholder="Contoh: Sosialisasi CBP untuk 200 peserta..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] bg-white text-slate-800 resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-activity"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingActivity ? 'Simpan Perubahan' : 'Simpan Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Activity Souvenirs Modal */}
      {detailActivity && (
        <div
          id="modal-activity-detail"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center border border-[#04457e]/20">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{detailActivity.name}</h3>
                  <p className="text-xs text-slate-500">
                    PIC: {detailActivity.pic} • {formatDateIndo(detailActivity.activityDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Event Info Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Lokasi:</span>
                  <span className="font-bold text-slate-900">{detailActivity.location || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Total Souvenir Keluar:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {activityDistributedSouvenirs.totalCount} item
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Variasi Jenis:</span>
                  <span className="font-bold text-slate-900">
                    {activityDistributedSouvenirs.items.length} jenis
                  </span>
                </div>
                {detailActivity.description && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-semibold block">Deskripsi Acara:</span>
                    <p className="text-slate-700 mt-0.5">{detailActivity.description}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Souvenir yang Didistribusikan
                  </h4>
                  {onDirectToBarangKeluar && setActiveTab && (
                    <button
                      onClick={() => {
                        const actId = detailActivity.id;
                        setDetailActivity(null);
                        setActiveTab('inventory-out');
                        if (onDirectToBarangKeluar) onDirectToBarangKeluar(actId);
                      }}
                      className="text-xs font-bold text-[#04457e] hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" /> + Tambah Pengeluaran Souvenir
                    </button>
                  )}
                </div>

                <div className="border border-slate-200/80 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Nama Souvenir</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-right">Jumlah Keluar</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {activityDistributedSouvenirs.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Belum ada souvenir yang dikeluarkan untuk kegiatan ini.
                          </td>
                        </tr>
                      ) : (
                        activityDistributedSouvenirs.items.map((it, idx) => (
                          <tr key={it.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{it.souvenirName}</td>
                            <td className="py-2.5 px-3 text-slate-600">{it.categoryName}</td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-600">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{it.description || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDetailActivity(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Agenda Kegiatan"
        message="Apakah Anda yakin ingin menghapus data kegiatan ini? Kegiatan yang telah memiliki catatan pengeluaran barang tidak dapat dihapus."
        confirmLabel="Hapus Kegiatan"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
