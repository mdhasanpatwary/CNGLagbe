import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Store, Plus, Users, Edit2, Trash2, Search, Check, AlertTriangle, X } from "lucide-react";

import { TextKey } from "@/constants/text";

interface BazarsTabProps {
  bazars: { id: string; name: string; isApproved: boolean; driverCount?: number }[];
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
  const [searchQuery, setSearchQuery] = useState("");
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
    const hasDrivers = (bazars.find(b => b.id === deletingBazar.id)?.driverCount || 0) > 0;
    await handleDeleteBazar(
      deletingBazar.id,
      deleteReason.trim(),
      hasDrivers ? mergeToBazarName : undefined
    );
    setIsDeleteModalOpen(false);
    setDeletingBazar(null);
    setDeleteReason("");
    setMergeToBazarName("");
  };

  const filteredBazars = bazars.filter((bazar) =>
    bazar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDeletingBazarData = deletingBazar ? bazars.find(b => b.id === deletingBazar.id) : null;
  const deletingBazarDriverCount = activeDeletingBazarData?.driverCount || 0;
  const isConfirmDisabled = !deleteReason.trim() || (deletingBazarDriverCount > 0 && !mergeToBazarName);

  const onApprove = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await handleApproveBazar(id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Store className="text-primary" />
              {t("bazars")}
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search") || "Search..."}
                  className="w-full sm:w-[200px] h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

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
                  className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-slate-900/10"
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
              {filteredBazars.map((bazar) => (
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
              {filteredBazars.length === 0 && (
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
                    এই বাজারে বর্তমানে <span className="font-black text-amber-950">{deletingBazarDriverCount}</span> জন ড্রাইভার যুক্ত আছেন। ডিলেট করার পূর্বে তাদের অন্য একটি সচল বাজারে স্থানান্তর করা আবশ্যক।
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    ড্রাইভারদের কোন বাজারে স্থানান্তর করবেন? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mergeToBazarName}
                    onChange={(e) => {
                      const targetName = e.target.value;
                      setMergeToBazarName(targetName);
                      if (targetName) {
                        setDeleteReason(`ভুল বানানের কারণে এই বাজারটি '${targetName}' বাজারের সাথে মার্জ করা হয়েছে।`);
                      } else {
                        setDeleteReason("");
                      }
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium bg-white text-slate-800"
                  >
                    <option value="">-- একটি অনুমোদিত বাজার সিলেক্ট করুন --</option>
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
                ডিলেট করার কারণ লিখুন (ব্যবহারকারী দেখতে পাবেন) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="যেমন: ভুল বানানের কারণে বাতিল করা হলো, অথবা এই বাজারটি ইতিমধ্যেই অন্য নামে বিদ্যমান।"
                className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all"
                required
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
