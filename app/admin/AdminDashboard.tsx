"use client";

import { Activity, Users, UserCheck, Store, History, AlertOctagon, UserPlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { DriversTab } from "./components/tabs/DriversTab";
import { UsersTab } from "./components/tabs/UsersTab";
import { LogsTab } from "./components/tabs/LogsTab";
import { BazarsTab } from "./components/tabs/BazarsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { IssuesTab } from "./components/tabs/IssuesTab";
import { WaitlistTab } from "./components/tabs/WaitlistTab";
import { ContributedDriversTab } from "./components/tabs/ContributedDriversTab";
import { TextKey } from "@/constants/text";
import { 
  DriverManagementModal, 
  RechargeModal, 
  TabNavigation, 
  AdminTab,
  DriverHistoryModal,
  ContributedDriverEditModal
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
    handleApprove,
    handleToggleSuspend,
    handleAddBazar,
    handleDeleteBazar,
    handleUpdateBazar,
    handleApproveBazar,
    handleRecharge,
    handleDeleteDriver,
    settings,
    handleUpdateSetting,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    historyDriver,
    setHistoryDriver,
    issues,
    issueSearch,
    setIssueSearch,
    issueFilter,
    setIssueFilter,
    issuePage,
    setIssuePage,
    issueMeta,
    handleResolveIssue,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    userPage,
    setUserPage,
    userMeta,
    bookingSearch,
    setBookingSearch,
    waitlist,
    waitlistSearch,
    setWaitlistSearch,
    waitlistFilter,
    setWaitlistFilter,
    waitlistPage,
    setWaitlistPage,
    waitlistMeta,
    handleDeleteWaitlist,
    contributedDrivers,
    contributedSearch,
    setContributedSearch,
    contributedFilter,
    setContributedFilter,
    handleApproveContributedDriver,
    handleDeleteContributedDriver,
    handleUpdateContributedDriver,
    isContributedEditModalOpen,
    setIsContributedEditModalOpen,
    editingContributedDriverData,
    setEditingContributedDriverData,
  } = useAdminDashboard();

  const contributors = Array.from(
    new Map(
      contributedDrivers
        .filter((d) => d.contributorPhone)
        .map((d) => [
          d.contributorPhone,
          {
            name: d.contributorName || "",
            phone: d.contributorPhone || "",
            photoUrl: d.contributorPhotoUrl || null,
          },
        ])
    ).values()
  );

  const tabs = [
    { id: "overview" as const, label: t("overview"), icon: Activity },
    { id: "drivers" as const, label: t("drivers"), icon: Users },
    { id: "users" as const, label: t("users"), icon: UserCheck },
    { id: "waitlist" as const, label: t("waitlist") || "Waitlist", icon: UserPlus },
    { id: "contributed-drivers" as const, label: t("contributed_drivers_tab" as TextKey) || "Contributed Drivers", icon: Users },
    { id: "bazars" as const, label: t("bazars"), icon: Store },
    { id: "logs" as const, label: t("logs"), icon: History },
    { id: "issues" as const, label: t("report_issue") || "Complaints", icon: AlertOctagon },
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
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
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
            setHistoryDriver={setHistoryDriver}
            setIsHistoryModalOpen={setIsHistoryModalOpen}
            t={t}
          />
        )}

        {activeTab === "users" && (
          <UsersTab
            allUsers={allUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userFilter={userFilter}
            setUserFilter={setUserFilter}
            userPage={userPage}
            setUserPage={setUserPage}
            userMeta={userMeta}
            t={t}
          />
        )}

        {activeTab === "waitlist" && (
          <WaitlistTab
            waitlist={waitlist}
            waitlistSearch={waitlistSearch}
            setWaitlistSearch={setWaitlistSearch}
            waitlistFilter={waitlistFilter}
            setWaitlistFilter={setWaitlistFilter}
            waitlistPage={waitlistPage}
            setWaitlistPage={setWaitlistPage}
            waitlistMeta={waitlistMeta}
            t={t}
            handleDeleteWaitlist={handleDeleteWaitlist}
          />
        )}

        {activeTab === "contributed-drivers" && (
          <ContributedDriversTab
            drivers={contributedDrivers}
            search={contributedSearch}
            setSearch={setContributedSearch}
            filter={contributedFilter}
            setFilter={setContributedFilter}
            onApprove={handleApproveContributedDriver}
            onDelete={handleDeleteContributedDriver}
            onEdit={(driver) => {
              setEditingContributedDriverData(driver);
              setIsContributedEditModalOpen(true);
            }}
            t={t}
          />
        )}

        {activeTab === "logs" && (
          <LogsTab
            stats={stats}
            bookings={bookings}
            paginatedBookings={paginatedBookings}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            handleSort={handleSort}
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
            handleApproveBazar={handleApproveBazar}
            t={t}
          />
        )}

        {activeTab === "issues" && (
          <IssuesTab
            t={t}
            issues={issues}
            issueSearch={issueSearch}
            setIssueSearch={setIssueSearch}
            issueFilter={issueFilter}
            setIssueFilter={setIssueFilter}
            issuePage={issuePage}
            setIssuePage={setIssuePage}
            issueMeta={issueMeta}
            handleResolveIssue={handleResolveIssue}
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
      <DriverHistoryModal
        isOpen={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        driver={historyDriver}
      />
      <ContributedDriverEditModal
        isOpen={isContributedEditModalOpen}
        onClose={() => setIsContributedEditModalOpen(false)}
        driver={editingContributedDriverData}
        bazars={bazars.map((b) => b.name)}
        contributors={contributors}
        onUpdate={handleUpdateContributedDriver}
        onSuccess={() => {}}
      />
    </div>
  );
}
