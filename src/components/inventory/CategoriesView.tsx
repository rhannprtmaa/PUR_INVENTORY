import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Tags, Layers, Calendar, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Category } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDateIndo } from '../../utils/exportUtils';

export const CategoriesView: React.FC = () => {
  const { categories, souvenirs, addCategory, updateCategory, deleteCategory, isAdmin, addToast } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirm State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama kategori wajib diisi.');
      return;
    }

    if (editingCategory) {
      const res = updateCategory(editingCategory.id, { name, description });
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui kategori.');
        return;
      }
    } else {
      const res = addCategory({ name, description });
      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan kategori.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      const res = deleteCategory(deleteTargetId);
      if (!res.success) {
        addToast(res.message || 'Gagal menghapus kategori.', 'error');
      }
      setDeleteTargetId(null);
    }
  };

  return (
    <div id="categories-view-container" className="space-y-6 pb-12">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#04457e]" />
            Kategori Souvenir
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-category"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-categories"
              type="text"
              placeholder="Cari nama atau deskripsi kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total: {filteredCategories.length} Kategori
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table id="table-categories" className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4 text-center">Jumlah Souvenir</th>
                <th className="py-3 px-4">Terakhir Diperbarui</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Tags className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada data kategori yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const itemCount = souvenirs.filter((s) => s.categoryId === cat.id).length;
                  return (
                    <tr
                      key={cat.id}
                      id={`row-cat-${cat.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cat.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {cat.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/60">
                          <Layers className="w-3 h-3" /> {itemCount} Item
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDateIndo(cat.updatedAt.split('T')[0])}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-cat-${cat.id}`}
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-slate-600 hover:text-[#04457e] hover:bg-[#04457e]/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              id={`btn-delete-cat-${cat.id}`}
                              onClick={() => setDeleteTargetId(cat.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kategori"
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div
          id="modal-category"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori Souvenir' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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
                    Nama Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-category-name"
                    type="text"
                    required
                    placeholder="Contoh: VVIP, VIP, Reguler ..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Kategori
                  </label>
                  <textarea
                    id="input-category-desc"
                    rows={3}
                    placeholder="Tuliskan keterangan peruntukan kategori ini..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#04457e]/20 focus:border-[#04457e] resize-none"
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
                  id="btn-save-category"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#04457e] hover:bg-[#033663] active:bg-[#022849] rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Hapus Kategori Souvenir"
        message="Apakah Anda yakin ingin menghapus kategori ini? Data souvenir yang terhubung dengan kategori ini akan tetap aman tersimpan."
        confirmLabel="Hapus Kategori"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
