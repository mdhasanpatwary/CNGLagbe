import React from "react";
import { Users, UserCheck, Store, UserPlus, ShieldAlert, Smartphone, PhoneCall } from "lucide-react";
import { TextKey } from "@/constants/text";
import { StatsCard } from "../shared";

interface AdminStats {
  totalUsers: number;
  totalWaitlist: number;
  totalContributedDrivers: number;
  pendingContributedDrivers: number;
  totalBazars: number;
  pwaInstallations: number;
  totalCallClicks: number;
}

interface OverviewTabProps {
  stats: AdminStats | null;
  t: (key: TextKey) => string | undefined;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  t,
}) => {
  return (
    <div className="space-y-6">
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title={t("total_users" as TextKey) || "Total Users"}
            value={stats.totalUsers || 0}
            desc={t("registered_accounts" as TextKey) || "Registered Passenger Accounts"}
            icon={UserCheck}
            variant="blue"
          />

          <StatsCard
            title={t("waitlist" as TextKey) || "Waitlist Entries"}
            value={stats.totalWaitlist || 0}
            desc={t("waitlist_sub" as TextKey) || "Users on the Launch Waiting List"}
            icon={UserPlus}
            variant="purple"
          />

          <StatsCard
            title={t("total_contributed_drivers" as TextKey) || "Contributed Drivers"}
            value={stats.totalContributedDrivers || 0}
            desc={t("directory_drivers" as TextKey) || "Drivers in Public Directory"}
            icon={Users}
            variant="primary"
          />

          <StatsCard
            title={t("pending_approvals" as TextKey) || "Pending Approvals"}
            value={stats.pendingContributedDrivers || 0}
            desc={t("needs_review" as TextKey) || "Directory submissions pending review"}
            icon={ShieldAlert}
            variant="amber"
          />

          <StatsCard
            title={t("total_bazars" as TextKey) || "Total Bazars / Stations"}
            value={stats.totalBazars || 0}
            desc={t("operating_areas" as TextKey) || "Active operating areas and stands"}
            icon={Store}
            variant="blue"
          />

          <StatsCard
            title={t("pwa_installations" as TextKey) || "PWA Installations"}
            value={stats.pwaInstallations || 0}
            desc={t("installed_devices" as TextKey) || "Devices with PWA installed"}
            icon={Smartphone}
            variant="purple"
          />

          <StatsCard
            title={t("total_call_clicks" as TextKey) || "Total Call Clicks"}
            value={stats.totalCallClicks || 0}
            desc={t("total_calls_sub" as TextKey) || "Total clicks on driver call buttons"}
            icon={PhoneCall}
            variant="primary"
          />
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium">No dashboard statistics available.</p>
        </div>
      )}
    </div>
  );
};
