import React, { useMemo } from 'react';
import { X, Boxes, ArrowDownToLine, ArrowUpFromLine, Layers, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { StockBadge, TypeBadge } from '../common/Badge';
import { formatDateIndo } from '../../utils/exportUtils';

interface SouvenirDetailModalProps {
  souvenirId: string | null;
  onClose: () => void;
}

export const SouvenirDetailModal: React.FC<SouvenirDetailModalProps> = ({ souvenirId, onClose }) => {
  const { souvenirs, categories, getSouvenirStock, transactionHistory } = useInventory();

  const souvenir = souvenirs.find((s) => s.id === souvenirId);
  const category = categories.find((c) => c.id === souvenir?.categoryId);

  const stockInfo = useMemo(() => {
    if (!souvenirId) return { totalIn: 0, totalOut: 0, currentStock: 0, status: 'Aman' as const };
    return getSouvenirStock(souvenirId);
  }, [souvenirId, getSouvenirStock]);

  // Filter history for this specific souvenir
  const itemHistory = useMemo(() => {
    if (!souvenirId) return [];
    return transactionHistory.filter((tx) => tx.souvenirId === souvenirId);
  }, [souvenirId, transactionHistory]);

  // Compute historical stock timeline for chart
  const timelineChartData = useMemo(() => {
    if (!souvenirId) return [];

    // Sort chronologically (oldest first)
    const chronological = [...itemHistory].reverse();
    let rollingStock = 0;
    const points: { date: string; displayDate: string; stock: number; change: number; type: string }[] = [];

    chronological.forEach((tx) => {
      if (tx.type === 'IN') {
        rollingStock += tx.quantity;
      } else {
        rollingStock = Math.max(0, rollingStock - tx.quantity);
      }

      points.push({
        date: tx.date,
        displayDate: tx.date.split('-').slice(1).join('/'),
        stock: rollingStock,
        change: tx.type === 'IN' ? tx.quantity : -tx.quantity,
        type: tx.type,
      });
    });

    return points;
  }, [souvenirId, itemHistory]);

  if (!souvenir) return null;

  return (
    <div
      id="modal-souvenir-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="modal-souvenir-detail-content"
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#04457e] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{souvenir.name}</h3>
              <p className="text-xs text-slate-200">
                Kategori: <span className="font-semibold text-white">{category?.name || '-'}</span> • Satuan: <span className="font-semibold text-white">{souvenir.unit}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-200 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Stock Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Stok Saat Ini</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {stockInfo.currentStock} <span className="text-xs font-semibold">{souvenir.unit}</span>
              </div>
              <div className="mt-1.5">
                <StockBadge status={stockInfo.status} size="sm" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Total Masuk</span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                +{stockInfo.totalIn} <span className="text-xs font-semibold">{souvenir.unit}</span>
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Akumulasi penerimaan</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Total Keluar</span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                -{stockInfo.totalOut} <span className="text-xs font-semibold">{souvenir.unit}</span>
              </div>
              <span className="text-[11px] text-rose-600 font-medium">Distribusi ke kegiatan</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Batas Minimum</span>
              <div className="text-2xl font-black text-slate-800 mt-1">
                {souvenir.minimumStock} <span className="text-xs font-semibold">{souvenir.unit}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Ambang batas menipis</span>
            </div>
          </div>

          {/* Mini Interactive Chart of Stock Change */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Riwayat Perubahan Stok Dari Waktu ke Waktu
            </h4>
            {timelineChartData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                      formatter={(val: number) => [`${val} ${souvenir.unit}`, 'Stok Tersedia']}
                      labelFormatter={(label) => `Tanggal Mutasi: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="stock"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#stockGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">Belum ada histori transaksi untuk grafik ini.</div>
            )}
          </div>

          {/* History Transactions Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Riwayat Transaksi Souvenir Ini
            </h4>
            <div className="border border-slate-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3 text-right">Jumlah</th>
                    <th className="py-2.5 px-3">Kegiatan / Catatan</th>
                    <th className="py-2.5 px-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {itemHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Belum ada riwayat transaksi untuk souvenir ini.
                      </td>
                    </tr>
                  ) : (
                    itemHistory.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {formatDateIndo(tx.date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`} {souvenir.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-700">
                          {tx.activityName ? (
                            <span className="font-semibold text-slate-900">{tx.activityName}: </span>
                          ) : null}
                          {tx.description}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">
                          {tx.user}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
