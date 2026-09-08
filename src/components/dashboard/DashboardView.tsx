import React, { useMemo } from 'react';
import {
  Boxes,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarCheck,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSouvenirDetail?: (souvenirId: string) => void;
}

const COLORS = ['#04457e', '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
}) => {
  const {
    categories,
    souvenirs,
    activities,
    inventoryIn,
    inventoryOut,
    inventoryOutItems,
    stockSummaries,
  } = useInventory();

  // Summary Metrics calculations
  const totalJenisSouvenir = souvenirs.length;
  const totalStokTersedia = stockSummaries.reduce((sum, item) => sum + item.currentStock, 0);
  const totalBarangMasuk = inventoryIn.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalBarangKeluar = inventoryOutItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalKegiatan = activities.length;

  // Monthly Data Calculation for Barang Masuk vs Keluar
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { month: string; masuk: number; keluar: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      monthsMap[key] = { month: label, masuk: 0, keluar: 0 };
    }

    inventoryIn.forEach((item) => {
      const ym = item.date.substring(0, 7);
      if (monthsMap[ym]) {
        monthsMap[ym].masuk += Number(item.quantity);
      }
    });

    inventoryOut.forEach((outHeader) => {
      const ym = outHeader.date.substring(0, 7);
      if (monthsMap[ym]) {
        const outItems = inventoryOutItems.filter((it) => it.inventoryOutId === outHeader.id);
        const sumQty = outItems.reduce((acc, it) => acc + Number(it.quantity), 0);
        monthsMap[ym].keluar += sumQty;
      }
    });

    return Object.values(monthsMap);
  }, [inventoryIn, inventoryOut, inventoryOutItems]);

  // Data for Category Stock Distribution
  const categoryStockData = useMemo(() => {
    return categories
      .map((cat) => {
        const items = stockSummaries.filter((s) => s.souvenir.categoryId === cat.id);
        const totalStock = items.reduce((sum, s) => sum + s.currentStock, 0);
        return {
          name: cat.name,
          value: totalStock,
        };
      })
      .filter((c) => c.value > 0);
  }, [categories, stockSummaries]);

  // Data for Souvenir usage by Activity
  const activityUsageData = useMemo(() => {
    return activities.map((act) => {
      const relatedOuts = inventoryOut.filter((o) => o.activityId === act.id).map((o) => o.id);
      const relatedItems = inventoryOutItems.filter((it) => relatedOuts.includes(it.inventoryOutId));
      const totalUsed = relatedItems.reduce((acc, it) => acc + Number(it.quantity), 0);
      return {
        name: act.name.length > 22 ? act.name.substring(0, 22) + '...' : act.name,
        fullName: act.name,
        total: totalUsed,
      };
    });
  }, [activities, inventoryOut, inventoryOutItems]);

  return (
    <div id="dashboard-container" className="space-y-6 pb-10">
      {/* 5 Summary Metric Cards */}
      <div id="summary-cards-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Jenis Souvenir */}
        <div
          id="card-total-jenis"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#04457e]/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Souvenir</span>
            <div className="w-8 h-8 rounded-xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 id="val-total-jenis" className="text-2xl font-black text-slate-900 tracking-tight">
              {totalJenisSouvenir}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Stok Tersedia */}
        <div
          id="card-total-stok"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stok Tersedia</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 id="val-total-stok" className="text-2xl font-black text-emerald-700 tracking-tight">
              {totalStokTersedia.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Card 3: Total Barang Masuk */}
        <div
          id="card-total-masuk"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#04457e]/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barang Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-[#04457e]/10 text-[#04457e] flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 id="val-total-masuk" className="text-2xl font-black text-[#04457e] tracking-tight">
              {totalBarangMasuk.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Card 4: Total Barang Keluar */}
        <div
          id="card-total-keluar"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barang Keluar</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 id="val-total-keluar" className="text-2xl font-black text-sky-700 tracking-tight">
              {totalBarangKeluar.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Card 5: Total Kegiatan */}
        <div
          id="card-total-kegiatan"
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kegiatan</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 id="val-total-kegiatan" className="text-2xl font-black text-slate-900 tracking-tight">
              {totalKegiatan}
            </h3>
          </div>
        </div>
      </div>

      {/* Analytical Visual Charts */}
      <div id="dashboard-charts-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Barang Masuk vs Keluar Bulanan */}
        <div
          id="chart-monthly-flow"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#04457e]" />
                Tren Arus Barang (Masuk vs Keluar)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-[#04457e]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#04457e]"></span> Masuk
              </span>
              <span className="flex items-center gap-1 text-sky-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span> Keluar
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#04457e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val: number) => [`${val} item`, '']}
                />
                <Bar dataKey="masuk" name="Barang Masuk" fill="#04457e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="keluar" name="Barang Keluar" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Penggunaan Souvenir Berdasarkan Kegiatan */}
        <div
          id="chart-activity-usage"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#04457e]" />
                Penggunaan Souvenir per Kegiatan
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('reporting')}
              className="text-xs font-bold text-[#04457e] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Detail →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={activityUsageData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  width={120}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#04457e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val: number, _name: string, props: any) => [
                    `${val} pcs`,
                    props?.payload?.fullName || 'Kegiatan',
                  ]}
                />
                <Bar dataKey="total" fill="#04457e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Proporsi Stok Berdasarkan Kategori */}
        <div
          id="chart-category-distribution"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#04457e]" />
                Komposisi Stok Berdasarkan Kategori
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="h-56 w-full md:col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryStockData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#04457e',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: number) => [`${val} unit`, 'Stok Tersedia']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ringkasan Kategori
              </h4>
              {categoryStockData.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{cat.value} pcs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
