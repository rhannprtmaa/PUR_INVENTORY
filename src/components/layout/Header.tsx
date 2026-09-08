import React, { useEffect, useState } from 'react';
import { Menu, Clock } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onNavigateProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenMobileMenu, onNavigateProfile }) => {
  const { currentUser } = useInventory();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setTimeStr(`${formatted} • ${time} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Monitoring';
      case 'souvenirs':
        return 'Katalog & Sisa Stok';
      case 'categories':
        return 'Kategori Souvenir';
      case 'inventory-in':
        return 'Barang Masuk';
      case 'inventory-out':
        return 'Barang Keluar';
      case 'activities':
      case 'add-activity':
        return 'Management Kegiatan';
      case 'reporting':
        return 'Reporting & Rekap';
      case 'profile':
        return 'Profil & Pengaturan Akun';
      default:
        return 'Monitoring Inventory';
    }
  };

  const title = getPageTitle();

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle, Mobile Logo & Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            id="btn-toggle-mobile-sidebar"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-200 shadow-2xs flex-shrink-0">
            <img
              src="/logo-bi.png"
              alt="Logo Bank Indonesia"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 id="page-main-heading" className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Date/Time & Clean Round Profile Avatar Only */}
        <div className="flex items-center gap-3">
          {/* Live Date/Time */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-medium border border-slate-200/60">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{timeStr}</span>
          </div>

          {/* Minimalist Round Avatar Profile */}
          <div
            id="header-user-avatar-circle"
            onClick={onNavigateProfile}
            className="relative group cursor-pointer"
            title={`${currentUser.name} (${currentUser.role.toUpperCase()}) - Klik untuk Kelola Profil`}
          >
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#04457e]/25 hover:border-[#04457e] shadow-xs transition-all flex items-center justify-center p-1.5 overflow-hidden">
              <img
                src={currentUser.avatar || '/logo-bi.png'}
                alt={currentUser.name}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
