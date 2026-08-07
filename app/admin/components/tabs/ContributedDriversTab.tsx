import { useState } from "react";
import { Check, Trash2, Search, Filter, Phone, MapPin, Edit, Users, UserCheck, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { ContributedDriver } from "../../hooks/useAdminDashboard";
import { TextKey } from "@/constants/text";
import { StatsCard } from "../shared";

interface ContributedDriversTabProps {
  drivers: ContributedDriver[];
  search: string;
  setSearch: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  meta: {
    total: number;
    totalPages: number;
    approvedCount: number;
    pendingCount: number;
    totalAll: number;
  };
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (driver: ContributedDriver) => void;
  t: (key: TextKey) => string | undefined;
}

export function ContributedDriversTab({
  drivers,
  search,
  setSearch,
  filter,
  setFilter,
  page,
  setPage,
  meta,
  onApprove,
  onDelete,
  onEdit,
  t,
}: ContributedDriversTabProps) {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleApprove = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await onApprove(id);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await onDelete(id);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Driver Count Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t("contributed_drivers_tab" as TextKey) || "Total Contributed Drivers"}
          value={meta.totalAll}
          desc={t("total_users" as TextKey) || "Total Submissions"}
          icon={Users}
          variant="blue"
        />
        <StatsCard
          title={t("contributed_approved" as TextKey) || "Approved Drivers"}
          value={meta.approvedCount}
          desc={t("approved_drivers" as TextKey) || "Approved"}
          icon={UserCheck}
          variant="primary"
        />
        <StatsCard
          title={t("contributed_pending" as TextKey) || "Pending Approval"}
          value={meta.pendingCount}
          desc={t("pending_drivers" as TextKey) || "Pending"}
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("search_driver_placeholder" as TextKey) || "Search by name, phone, bazar..."}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="text-slate-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 bg-white min-w-[160px]"
          >
            <option value="all">All ({meta.totalAll})</option>
            <option value="pending">Pending ({meta.pendingCount})</option>
            <option value="approved">Approved ({meta.approvedCount})</option>
          </select>
        </div>
      </div>

      {/* Driver List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Bazar</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Address</th>
                <th className="p-4">Contributor</th>
                <th className="p-4">Calls</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No contributed drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{driver.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{driver.nearbyBazar}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        driver.vehicleType === "AMBULANCE"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : driver.vehicleType === "TOTO"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {driver.vehicleType === "AMBULANCE"
                          ? (t("vehicle_ambulance" as TextKey) || "Ambulance")
                          : driver.vehicleType === "TOTO"
                            ? (t("vehicle_toto" as TextKey) || "Toto")
                            : (t("vehicle_cng" as TextKey) || "CNG")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-normal">{driver.address || driver.nearbyBazar || "—"}</td>
                    <td className="p-4">
                      {driver.contributorName ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{driver.contributorName}</span>
                          {driver.contributorPhone && <span className="text-xs text-slate-400 font-normal">{driver.contributorPhone}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-900 font-bold">
                      {driver.callCount ?? 0}
                    </td>
                    <td className="p-4">
                      {driver.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                          {t("contributed_approved" as TextKey) || "Approved"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                          {t("contributed_pending" as TextKey) || "Pending"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!driver.isApproved && (
                          <AppButton
                            onClick={() => handleApprove(driver.id)}
                            loading={actionLoading[driver.id]}
                            variant="success"
                            size="sm"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </AppButton>
                        )}
                        <AppButton
                          onClick={() => onEdit(driver)}
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </AppButton>
                        <AppButton
                          onClick={() => handleDelete(driver.id)}
                          loading={actionLoading[driver.id]}
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </AppButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 mt-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <AppButton
              variant="ghost"
              onClick={() => setPage((prev) => Math.max(1, typeof prev === 'number' ? prev - 1 : 1))}
              disabled={page === 1}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronLeft size={16} />}
            />
            <div className="text-[10px] font-black text-slate-600 px-5 bg-slate-100 h-10 flex items-center rounded-xl uppercase tracking-widest">
              {page} / {Math.max(1, meta.totalPages)}
            </div>
            <AppButton
              variant="ghost"
              onClick={() => setPage((prev) => Math.min(meta.totalPages, typeof prev === 'number' ? prev + 1 : meta.totalPages))}
              disabled={page === meta.totalPages || meta.totalPages === 0}
              className="h-10 w-10 p-0 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              leftIcon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
