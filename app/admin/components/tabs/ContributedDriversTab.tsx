import { useState } from "react";
import { Check, Trash2, Search, Filter, Phone, MapPin } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { ContributedDriver } from "../../hooks/useAdminDashboard";
import { TextKey } from "@/constants/text";

interface ContributedDriversTabProps {
  drivers: ContributedDriver[];
  search: string;
  setSearch: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  onApprove: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  t: (key: TextKey) => string | undefined;
}

export function ContributedDriversTab({
  drivers,
  search,
  setSearch,
  filter,
  setFilter,
  onApprove,
  onDelete,
  t,
}: ContributedDriversTabProps) {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const filtered = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      (d.address && d.address.toLowerCase().includes(search.toLowerCase())) ||
      (d.nearbyBazar && d.nearbyBazar.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !d.isApproved) ||
      (filter === "approved" && d.isApproved);

    return matchesSearch && matchesFilter;
  });

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
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_driver_placeholder" as TextKey) || "Search..."}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="text-slate-400 w-5 h-5" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-900 bg-white min-w-[150px]"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
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
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No contributed drivers found.
                  </td>
                </tr>
              ) : (
                filtered.map((driver) => (
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
                        driver.vehicleType === "TOTO"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {driver.vehicleType === "TOTO"
                          ? (t("vehicle_toto" as TextKey) || "Toto")
                          : (t("vehicle_cng" as TextKey) || "CNG")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-normal">{driver.address || driver.nearbyBazar || "—"}</td>
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
    </div>
  );
}
