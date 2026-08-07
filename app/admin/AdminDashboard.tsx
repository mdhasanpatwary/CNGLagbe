"use client";

import { Activity, Users, UserCheck, Store, UserPlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { PageHeading } from "@/components/ui/PageHeading";
import { useAdminDashboard, AdminTab } from "./hooks/useAdminDashboard";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { UsersTab } from "./components/tabs/UsersTab";
import { BazarsTab } from "./components/tabs/BazarsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { WaitlistTab } from "./components/tabs/WaitlistTab";
import { ContributedDriversTab } from "./components/tabs/ContributedDriversTab";
import { TextKey } from "@/constants/text";
import { 
  TabNavigation, 
  ContributedDriverEditModal
} from "./components/shared";
import { Settings as SettingsIcon } from "lucide-react";

export default function AdminDashboard() {
  const {
    t,
    stats,
    allUsers,
    bazars,
    bazarSearch,
    setBazarSearch,
    bazarFilter,
    setBazarFilter,
    bazarPage,
    setBazarPage,
    bazarMeta,
    newBazarName,
    setNewBazarName,
    editingBazar,
    setEditingBazar,
    activeTab,
    setActiveTab,
    isRefreshing,
    fetchData,
    handleAddBazar,
    handleDeleteBazar,
    handleUpdateBazar,
    handleApproveBazar,
    settings,
    handleUpdateSetting,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    userPage,
    setUserPage,
    userMeta,
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
    contributedPage,
    setContributedPage,
    contributedMeta,
    handleApproveContributedDriver,
    handleDeleteContributedDriver,
    handleUpdateContributedDriver,
    isContributedEditModalOpen,
    setIsContributedEditModalOpen,
    editingContributedDriverData,
    setEditingContributedDriverData,
    handleDeleteUser,
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
    { id: "waitlist" as const, label: t("waitlist") || "Waitlist", icon: UserPlus },
    { id: "contributed-drivers" as const, label: t("contributed_drivers_tab" as TextKey) || "Contributed Drivers", icon: Users },
    { id: "bazars" as const, label: t("bazars"), icon: Store },
    { id: "users" as const, label: t("users"), icon: UserCheck },
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
          onTabChange={(tab) => setActiveTab(tab as AdminTab)}
          tabs={tabs}
        />

        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
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
            onDeleteUser={handleDeleteUser}
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
            page={contributedPage}
            setPage={setContributedPage}
            meta={contributedMeta}
            onApprove={handleApproveContributedDriver}
            onDelete={handleDeleteContributedDriver}
            onEdit={(driver) => {
              setEditingContributedDriverData(driver);
              setIsContributedEditModalOpen(true);
            }}
            t={t}
          />
        )}

        {activeTab === "bazars" && (
          <BazarsTab
            bazars={bazars}
            search={bazarSearch}
            setSearch={setBazarSearch}
            filter={bazarFilter}
            setFilter={setBazarFilter}
            page={bazarPage}
            setPage={setBazarPage}
            meta={bazarMeta}
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

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            handleUpdateSetting={handleUpdateSetting}
            t={t}
          />
        )}
      </main>

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
