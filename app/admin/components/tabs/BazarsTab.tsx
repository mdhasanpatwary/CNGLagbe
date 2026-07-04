import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Store, Plus, Users, Edit2, Trash2, Search, Check } from "lucide-react";

import { TextKey } from "@/constants/text";

interface BazarsTabProps {
  bazars: { id: string; name: string; isApproved: boolean; driverCount?: number }[];
  newBazarName: string;
  setNewBazarName: (name: string) => void;
  editingBazar: { id: string; name: string } | null;
  setEditingBazar: (bazar: { id: string; name: string } | null) => void;
  handleAddBazar: () => void;
  handleDeleteBazar: (id: string) => void;
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

  const filteredBazars = bazars.filter((bazar) =>
    bazar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                            onClick={() => handleDeleteBazar(bazar.id)}
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
    </div>
  );
}
