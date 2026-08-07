import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Store, Plus, Users, Edit2, Trash2, Search, Check, AlertTriangle, X, Filter, Clock, ChevronLeft, ChevronRight } from "lucide-react";

import { TextKey } from "@/constants/text";
import { StatsCard } from "../shared";

interface BazarsTabProps {
  bazars: { id: string; name: string; isApproved: boolean; driverCount?: number }[];
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
  newBazarName: string;
  setNewBazarName: (name: string) => void;
  editingBazar: { id: string; name: string } | null;
  setEditingBazar: (bazar: { id: string; name: string } | null) => void;
  handleAddBazar: () => void;
  handleDeleteBazar: (id: string, reason?: string, mergeToBazarName?: string) => void;
  handleUpdateBazar: () => void;
  handleApproveBazar: (id: string) => void;
  t: (key: TextKey) => string;
}

export function BazarsTab({
  bazars,
  search,
  setSearch,
  filter,
  setFilter,
  page,
  setPage,
  meta,
  newBazarName,
  setNewBazarName,
  editingBazar,
  setEditingBazar,
  handleAddBazar,
  handleDeleteBazar,
  handleUpdateBazar,
  handleApproveBazar,
  t,
}: BazarsTabProps) {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBazar, setDeletingBazar] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [mergeToBazarName, setMergeToBazarName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const confirmDelete = async () => {
    if (!deletingBazar) return;
    await handleDeleteBazar(
      deletingBazar.id,
      deleteReason.trim(),
      mergeToBazarName || undefined
    );
    setIsDeleteModalOpen(false);
    setDeletingBazar(null);
    setDeleteReason("");
    setMergeToBazarName("");
  };

  const activeDeletingBazarData = deletingBazar ? bazars.find(b => b.id === deletingBazar.id) : null;
  const deletingBazarDriverCount = activeDeletingBazarData?.driverCount || 0;
  const isConfirmDisabled = false;

  const onApprove = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await handleApproveBazar(id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Bazar Count Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t("bazars" as TextKey) || "Total Bazars"}
          value={meta.totalAll}
          desc={t("bazar_name" as TextKey) || "Total Listed Bazars"}
          icon={Store}
          variant="blue"
        />
        <StatsCard
          title={t("contributed_approved" as TextKey) || "Approved Bazars"}
          value={meta.approvedCount}
          desc={t("contributed_approved" as TextKey) || "Approved"}
          icon={Check}
          variant="primary"
        />
        <StatsCard
          title={t("contributed_pending" as TextKey) || "Pending Approval"}
          value={meta.pendingCount}
          desc={t("contributed_pending" as TextKey) || "Pending"}
          icon={Clock}
          variant="amber"
        />
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Store className="text-primary" />
              {t("bazars")}
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t("search") || "Search bazar..."}
                  className="w-full sm:w-[200px] h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none w-full sm:w-auto h-11 rounded-xl pl-10 pr-8 text-xs font-black uppercase border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-slate-700 transition-all"
                >
                  <option value="all">All ({meta.totalAll})</option>
                  <option value="pending">Pending ({meta.pendingCount})</option>
                  <option value="approved">Approved ({meta.approvedCount})</option>
                </select>
                <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Add Bazar Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newBazarName}
                  onChange={(e) => setNewBazarName(e.target.value)}
                  placeholder={t("bazar_name")}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[150px] flex-1 sm:flex-initial"
                  onKeyDown={(e) => e.key === "Enter" && handleAddBazar()}
                />
                <AppButton
                  onClick={handleAddBazar}
                  className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10 shrink-0"
                  leftIcon={<Plus size={16} />}
                >
                  {t("add_bazar")}
                </AppButton>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("bazar_name")}</TableHead>
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("bazar_status" as TextKey) || "Status"}</TableHead>
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{t("drivers")}</TableHead>
                <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bazars.map((bazar) => (
                <TableRow key={bazar.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                  <TableCell className="px-8 py-6">
                    {editingBazar?.id === bazar.id ? (
                      <input
                        type="text"
                        value={editingBazar.name}
                        onChange={(e) => setEditingBazar({ ...editingBazar, name: e.target.value })}
                        className="h-9 px-3 rounded-lg border border-primary text-sm focus:outline-none bg-white w-full max-w-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateBazar();
                          if (e.key === "Escape") setEditingBazar(null);
                        }}
                      />
                    ) : (
                      <p className="font-black text-slate-900">{bazar.name}</p>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    {bazar.isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                        {t("contributed_approved" as TextKey) || "Approved"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                        {t("contributed_pending" as TextKey) || "Pending"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{bazar.driverCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!bazar.isApproved && (
                        <AppButton
                          onClick={() => onApprove(bazar.id)}
                          loading={actionLoading[bazar.id]}
                          variant="success"
                          size="sm"
                          className="h-9 px-3 rounded-xl font-bold uppercase text-[10px] tracking-wider"
                          leftIcon={<Check size={14} />}
                        >
                          {t("approve" as TextKey) || "Approve"}
                        </AppButton>
                      )}
                      {editingBazar?.id === bazar.id ? (
                        <>
                          <AppButton
                            onClick={handleUpdateBazar}
                            variant="primary"
                            className="h-8 px-3 text-[9px] font-black uppercase rounded-lg"
                          >
                            {t("save_changes")}
                          </AppButton>
                          <AppButton
                            onClick={() => setEditingBazar(null)}
                            variant="ghost"
                            className="h-8 px-3 text-[9px] font-black uppercase rounded-lg border border-slate-200"
                          >
                            {t("back")}
                          </AppButton>
                        </>
                      ) : (
                        <>
                          <AppButton
                            onClick={() => setEditingBazar(bazar)}
                            variant="ghost"
                            className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl flex items-center justify-center shrink-0"
                            leftIcon={<Edit2 size={16} />}
                          />
                          <AppButton
                            onClick={() => {
                              setDeletingBazar({ id: bazar.id, name: bazar.name });
                              setDeleteReason("");
                              setIsDeleteModalOpen(true);
                            }}
                            variant="ghost"
                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center shrink-0"
                            leftIcon={<Trash2 size={16} />}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bazars.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 italic">
                      <Store size={40} className="opacity-10" />
                      <p className="text-sm">{t("not_found")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

      {mounted && isDeleteModalOpen && deletingBazar && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <AppButton
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingBazar(null);
                setDeleteReason("");
                setMergeToBazarName("");
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-xl p-1.5 hover:bg-slate-50 transition-colors min-h-[auto] h-auto px-2"
            >
              <X size={18} />
            </AppButton>

            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-bn">
                {t("delete_bazar_confirm" as TextKey) || "বাজার ডিলেট নিশ্চিত করুন"}
              </h3>
            </div>

            <p className="text-sm text-slate-500 mb-5 leading-relaxed font-bold">
              আপনি কি নিশ্চিতভাবে <span className="text-slate-900 font-black font-bn">&quot;{deletingBazar.name}&quot;</span> বাজারটি ডিলেট করতে চান?
            </p>

            {deletingBazarDriverCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 space-y-3">
                <div className="flex items-start gap-2.5 text-amber-800">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-xs font-bold leading-normal">
                    এই বাজারে বর্তমানে <span className="font-black text-amber-950">{deletingBazarDriverCount}</span> জন ড্রাইভার যুক্ত আছেন। চাইলে তাদের অন্য একটি বাজারে স্থানান্তর করতে পারেন (ঐচ্ছিক)।
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    ড্রাইভারদের কোন বাজারে স্থানান্তর করবেন? (ঐচ্ছিক)
                  </label>
                  <select
                    value={mergeToBazarName}
                    onChange={(e) => setMergeToBazarName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium bg-white text-slate-800"
                  >
                    <option value="">-- কোনো স্থানান্তর নয় (ড্রাইভার বাজার খালি হবে) --</option>
                    {bazars
                      .filter((b) => b.isApproved && b.id !== deletingBazar.id)
                      .map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block ml-1">
                ডিলেট করার কারণ লিখুন (ঐচ্ছিক)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="যেমন: ভুল বানানের কারণে বাতিল করা হলো (ঐচ্ছিক)"
                className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <AppButton
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingBazar(null);
                  setDeleteReason("");
                  setMergeToBazarName("");
                }}
                className="font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2.5 h-11"
              >
                {t("cancel") || "বাতিল"}
              </AppButton>
              <AppButton
                type="button"
                variant="outline"
                onClick={confirmDelete}
                disabled={isConfirmDisabled}
                className="font-bold bg-rose-600 text-white hover:bg-rose-700 border-transparent hover:border-transparent rounded-xl px-4 py-2.5 h-11 disabled:opacity-50"
              >
                {t("delete") || "ডিলেট করুন"}
              </AppButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
