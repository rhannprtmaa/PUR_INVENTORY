import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CategoriesView } from './components/inventory/CategoriesView';
import { SouvenirsView } from './components/inventory/SouvenirsView';
import { InventoryInView } from './components/inventory/InventoryInView';
import { InventoryOutView } from './components/inventory/InventoryOutView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { ReportsView } from './components/reports/ReportsView';
import { ProfileView } from './components/profile/ProfileView';
import { SouvenirDetailModal } from './components/inventory/SouvenirDetailModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useInventory();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSouvenirDetailId, setSelectedSouvenirDetailId] = useState<string | null>(null);

  // Cross-navigation states
  const [prefilledActivityId, setPrefilledActivityId] = useState<string | undefined>(undefined);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const handleSelectSouvenirDetail = (souvenirId: string) => {
    setSelectedSouvenirDetailId(souvenirId);
  };

  const handleDirectToBarangKeluar = (actId: string) => {
    setPrefilledActivityId(actId);
    setActiveTab('inventory-out');
  };

  const handleOpenAddActivityModal = () => {
    setActiveTab('activities');
    setIsActivityModalOpen(true);
  };

  // If user is not logged in, render the Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <LoginView />
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-100/70 font-sans text-slate-800 overflow-hidden antialiased selection:bg-[#04457e] selection:text-white">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Global Souvenir Detail Modal */}
      {selectedSouvenirDetailId && (
        <SouvenirDetailModal
          souvenirId={selectedSouvenirDetailId}
          onClose={() => setSelectedSouvenirDetailId(null)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onOpenAddActivityModal={handleOpenAddActivityModal}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onNavigateProfile={() => setActiveTab('profile')}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-10 sm:pb-12 safe-bottom">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                onSelectSouvenirDetail={handleSelectSouvenirDetail}
              />
            )}

            {activeTab === 'souvenirs' && (
              <SouvenirsView onSelectSouvenirDetail={handleSelectSouvenirDetail} />
            )}

            {activeTab === 'categories' && <CategoriesView />}

            {activeTab === 'inventory-in' && (
              <InventoryInView onSelectSouvenirDetail={handleSelectSouvenirDetail} />
            )}

            {activeTab === 'inventory-out' && (
              <InventoryOutView
                initialActivityId={prefilledActivityId}
                onClearInitialActivityId={() => setPrefilledActivityId(undefined)}
                onSelectSouvenirDetail={handleSelectSouvenirDetail}
              />
            )}

            {activeTab === 'activities' && (
              <ActivitiesView
                onDirectToBarangKeluar={handleDirectToBarangKeluar}
                setActiveTab={setActiveTab}
                isAddModalAutoOpen={isActivityModalOpen}
                onCloseAddModalAutoOpen={() => setIsActivityModalOpen(false)}
              />
            )}

            {activeTab === 'reporting' && <ReportsView />}

            {activeTab === 'profile' && <ProfileView />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainContent />
    </InventoryProvider>
  );
}
