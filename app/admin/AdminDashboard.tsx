"use client";

import { Activity, Users, UserCheck, Store, History } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { DriversTab } from "./components/tabs/DriversTab";
import { UsersTab } from "./components/tabs/UsersTab";
import { LogsTab } from "./components/tabs/LogsTab";
import { BazarsTab } from "./components/tabs/BazarsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { 
  DriverManagementModal, 
  RechargeModal, 
  TabNavigation, 
  AdminTab 
} from "./components/shared";
import { Settings as SettingsIcon } from "lucide-react";

export default function AdminDashboard() {
  const {
    t,
    stats,
    bookings,
    activeBookings,
    allUsers,
    bazars,
    newBazarName,
    setNewBazarName,
    editingBazar,
    setEditingBazar,
    activeTab,
    setActiveTab,
    isRefreshing,
    logFilter,
    setLogFilter,
    handleSort,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    paginatedBookings,
    selectedDriver,
    setSelectedDriver,
    isRechargeModalOpen,
    setIsRechargeModalOpen,
    rechargeAmount,
    setRechargeAmount,
    rechargeNote,
    setRechargeNote,
    isRecharging,
    isDriverModalOpen,
    setIsDriverModalOpen,
    editingDriverData,
    setEditingDriverData,
    driverSearch,
    setDriverSearch,
    setDriverPage,
    driverMeta,
    pendingDrivers,
    onlineDrivers,
    allDrivers,
    driverFilter,
    setDriverFilter,
    driverSort,
    setDriverSort,
    fetchData,
    fetchBookings,
    handleApprove,
    handleToggleSuspend,
    handleAddBazar,
    handleDeleteBazar,
    handleUpdateBazar,
    handleRecharge,
    handleDeleteDriver,
    settings,
    handleUpdateSetting,
  } = useAdminDashboard();

  const tabs = [
    { id: "overview" as const, label: t("overview"), icon: Activity },
    { id: "drivers" as const, label: t("drivers"), icon: Users },
    { id: "users" as const, label: t("users"), icon: UserCheck },
    { id: "bazars" as const, label: t("bazars"), icon: Store },
    { id: "logs" as const, label: t("logs"), icon: History },
    { id: "settings" as const, label: t("settings") || "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header
        role="admin"
        onRefresh={() => fetchData({ showLoading: true })}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <PageHeading
          title={t("admin_dashboard") as string}
          subtitle={t("admin_portal") as string}
          className="mb-8"
        />

        <TabNavigation
          activeTab={activeTab as AdminTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            activeBookings={activeBookings}
            onlineDrivers={onlineDrivers}
            pendingDrivers={pendingDrivers}
            paginatedBookings={paginatedBookings}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalBookings={bookings.length}
            handleSort={handleSort}
            handleApprove={handleApprove}
            t={t}
          />
        )}

        {activeTab === "drivers" && (
          <DriversTab
            allDrivers={allDrivers}
            driverMeta={driverMeta}
            driverSearch={driverSearch}
            setDriverSearch={setDriverSearch}
            driverFilter={driverFilter}
            setDriverFilter={setDriverFilter}
            driverSort={driverSort}
            setDriverSort={setDriverSort}
            setDriverPage={setDriverPage}
            setEditingDriverData={setEditingDriverData}
            setIsDriverModalOpen={setIsDriverModalOpen}
            handleApprove={handleApprove}
            setSelectedDriver={setSelectedDriver}
            setIsRechargeModalOpen={setIsRechargeModalOpen}
            handleToggleSuspend={handleToggleSuspend}
            handleDeleteDriver={handleDeleteDriver}
            t={t}
          />
        )}

        {activeTab === "users" && <UsersTab allUsers={allUsers} t={t} />}

        {activeTab === "logs" && (
          <LogsTab
            stats={stats}
            bookings={bookings}
            paginatedBookings={paginatedBookings}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            handleSort={handleSort}
            fetchBookings={fetchBookings}
            t={t}
          />
        )}

        {activeTab === "bazars" && (
          <BazarsTab
            bazars={bazars}
            newBazarName={newBazarName}
            setNewBazarName={setNewBazarName}
            editingBazar={editingBazar}
            setEditingBazar={setEditingBazar}
            handleAddBazar={handleAddBazar}
            handleDeleteBazar={handleDeleteBazar}
            handleUpdateBazar={handleUpdateBazar}
            t={t}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            handleUpdateSetting={handleUpdateSetting}
            t={t}
          />
        )}
      </main>

      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        driver={selectedDriver}
        rechargeAmount={rechargeAmount}
        setRechargeAmount={setRechargeAmount}
        rechargeNote={rechargeNote}
        setRechargeNote={setRechargeNote}
        handleRecharge={handleRecharge}
        isRecharging={isRecharging}
        t={t}
      />

      <DriverManagementModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        driver={editingDriverData}
        bazars={bazars.map((b) => b.name)}
        onSuccess={() => {
          fetchData({ showLoading: false });
        }}
      />
    </div>
  );
}
