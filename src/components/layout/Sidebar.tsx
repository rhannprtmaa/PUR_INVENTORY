import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarCheck,
  CalendarPlus,
  Calendar,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  X,
  LogOut,
  Tags,
  Boxes,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export type ActiveTab =
  | 'dashboard'
  | 'categories'
  | 'souvenirs'
  | 'inventory-in'
  | 'inventory-out'
  | 'activities'
  | 'add-activity'
  | 'reporting'
  | 'history'
  | 'profile';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAddActivityModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAddActivityModal,
}) => {
  const {
    currentUser,
    isAdmin,
    logout,
    categories,
    souvenirs,
    activities,
  } = useInventory();

  const [isManagementOpen, setIsManagementOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  const handleNavClick = (tab: ActiveTab) => {
    if (tab === 'add-activity') {
      if (onOpenAddActivityModal) {
        onOpenAddActivityModal();
      } else {
        setActiveTab('activities');
      }
    } else {
      setActiveTab(tab);
    }
    setIsMobileOpen(false);
  };

  const isManagementActive = ['souvenirs', 'categories', 'activities'].includes(activeTab);
  const isInventoryActive = ['inventory-in', 'inventory-out'].includes(activeTab);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-72 max-w-[85vw] bg-[#04457e] text-white flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out border-r border-[#033663] shadow-xl lg:shadow-none select-none safe-top ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm flex-shrink-0 border border-white/40">
              <img
                src="/logo-bi.png"
                alt="Logo Bank Indonesia"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                PUR <span className="text-sky-300">INVENTORY</span>
              </h1>
              <p className="text-[10px] font-medium text-sky-200/80">Bank Indonesia Sulsel</p>
            </div>
          </div>
          <button
            id="btn-close-sidebar-mobile"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-sky-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5 text-slate-100 scrollbar-thin scrollbar-thumb-white/20">
          {/* Dashboard */}
          <button
            id="nav-btn-dashboard"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white/15 text-white shadow-xs font-bold border-l-3 border-sky-300'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-sky-200" />
            <span>Dashboard</span>
          </button>

          {/* Section: Management Inventory (Moved above Input Inventory) */}
          <div className="pt-1">
            <button
              id="nav-dropdown-management"
              onClick={() => setIsManagementOpen(!isManagementOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                isManagementActive ? 'text-sky-300' : 'text-sky-200/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-sky-200" />
                <span>Management Inventory</span>
              </div>
              {isManagementOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isManagementOpen && (
              <div className="pl-3 mt-1 space-y-1 border-l-2 border-white/15 ml-3">
                <button
                  id="nav-btn-souvenirs"
                  onClick={() => handleNavClick('souvenirs')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'souvenirs'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-sky-300'
                      : 'text-sky-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-3.5 h-3.5 flex-shrink-0 text-sky-300" />
                    <span>Katalog & Sisa Stok</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-sky-100">
                    {souvenirs.length}
                  </span>
                </button>

                <button
                  id="nav-btn-categories"
                  onClick={() => handleNavClick('categories')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-sky-300'
                      : 'text-sky-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tags className="w-3.5 h-3.5 flex-shrink-0 text-teal-300" />
                    <span>Kategori Souvenir</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-sky-100">
                    {categories.length}
                  </span>
                </button>

                <button
                  id="nav-btn-activities-list"
                  onClick={() => handleNavClick('activities')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'activities'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-sky-300'
                      : 'text-sky-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-sky-200" />
                    <span>Daftar Kegiatan</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-sky-100">
                    {activities.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Input Inventory */}
          <div className="pt-1">
            <button
              id="nav-dropdown-inventory"
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                isInventoryActive ? 'text-sky-300' : 'text-sky-200/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-200" />
                <span>Input Inventory</span>
              </div>
              {isInventoryOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isInventoryOpen && (
              <div className="pl-3 mt-1 space-y-1 border-l-2 border-white/15 ml-3">
                <button
                  id="nav-btn-inventory-in"
                  onClick={() => handleNavClick('inventory-in')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'inventory-in'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-sky-300'
                      : 'text-sky-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 flex-shrink-0 text-emerald-300" />
                  <span>Barang Masuk</span>
                </button>

                <button
                  id="nav-btn-inventory-out"
                  onClick={() => handleNavClick('inventory-out')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeTab === 'inventory-out'
                      ? 'bg-white/15 text-white font-bold border-l-2 border-sky-300'
                      : 'text-sky-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 flex-shrink-0 text-amber-300" />
                  <span>Barang Keluar</span>
                </button>
              </div>
            )}
          </div>

          {/* Reporting */}
          <div className="pt-1">
            <button
              id="nav-btn-reporting"
              onClick={() => handleNavClick('reporting')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'reporting'
                  ? 'bg-white/15 text-white shadow-xs font-bold border-l-3 border-sky-300'
                  : 'text-sky-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 flex-shrink-0 text-sky-200" />
              <span>Reporting &amp; Rekap</span>
            </button>
          </div>
        </div>

        {/* User Card & Profile Navigation Footer */}
        <div className="p-3.5 pt-3.5 pb-8 sm:pb-10 border-t border-white/10 bg-[#033663]/50 flex-shrink-0 safe-bottom">
          <div
            className={`flex items-center justify-between p-2.5 mb-1 rounded-2xl transition-all shadow-xs ${
              activeTab === 'profile'
                ? 'bg-white/20 border border-white/30 ring-2 ring-sky-300/40'
                : 'bg-white/10 border border-white/10 hover:bg-white/15'
            }`}
          >
            <button
              id="btn-sidebar-profile"
              type="button"
              onClick={() => handleNavClick('profile')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
              title="Buka Profil & Pengaturan Akun"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-white/20 flex-shrink-0 flex items-center justify-center p-1 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                <img
                  src={currentUser.avatar || '/logo-bi.png'}
                  alt={currentUser.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-sky-200 transition-colors">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-400/20 text-sky-200 border border-sky-300/30">
                    <ShieldCheck className="w-2.5 h-2.5" /> PENGELOLA
                  </span>
                  <span className="text-[10px] text-sky-200/80 truncate">
                    {currentUser.department?.split(' ')[0]}
                  </span>
                </div>
              </div>
            </button>

            <button
              id="btn-sidebar-logout"
              onClick={logout}
              title="Keluar (Sign Out)"
              className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-rose-500/30 transition-colors ml-1 cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
