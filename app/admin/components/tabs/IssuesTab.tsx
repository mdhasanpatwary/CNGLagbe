import React, { useState } from "react";
import { 
  AlertOctagon, 
  Search, 
  Eye, 
  MapPin, 
  User, 
  Navigation,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/badge";
import { TextKey } from "@/constants/text";
import { IssueReportType } from "@/lib/types/admin";

interface IssuesTabProps {
  t: (key: TextKey) => string;
  issues: IssueReportType[];
  issueSearch: string;
  setIssueSearch: (val: string) => void;
  issueFilter: string;
  setIssueFilter: (val: string) => void;
  issuePage: number;
  setIssuePage: (page: number) => void;
  issueMeta: { total: number; totalPages: number };
  handleResolveIssue: (id: string, note: string) => Promise<boolean>;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({
  t,
  issues,
  issueSearch,
  setIssueSearch,
  issueFilter,
  setIssueFilter,
  issuePage,
  setIssuePage,
  issueMeta,
  handleResolveIssue,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<IssueReportType | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "DRIVER_DEMANDED_EXTRA_MONEY":
        return t("reason_extra_money") || "Driver demanded extra money";
      case "DRIVER_BEHAVED_POORLY":
        return t("reason_poor_behavior") || "Driver behaved poorly";
      case "DRIVER_DID_NOT_ARRIVE":
        return t("reason_no_arrive") || "Driver did not arrive";
      case "LOST_ITEMS_IN_VEHICLE":
        return t("reason_lost_items") || "Lost items in vehicle";
      case "OTHER":
        return t("reason_other") || "Other";
      default:
        return reason;
    }
  };

  const getReasonColorClass = (reason: string) => {
    switch (reason) {
      case "DRIVER_DEMANDED_EXTRA_MONEY":
        return "bg-red-50 text-red-600 border-red-100";
      case "DRIVER_BEHAVED_POORLY":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "DRIVER_DID_NOT_ARRIVE":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "LOST_ITEMS_IN_VEHICLE":
        return "bg-purple-50 text-purple-600 border-purple-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const onResolveSubmit = async () => {
    if (!selectedIssue || !resolutionNote.trim()) return;
    setIsResolving(true);
    const success = await handleResolveIssue(selectedIssue.id, resolutionNote.trim());
    setIsResolving(false);
    if (success) {
      setSelectedIssue(null);
      setResolutionNote("");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <AlertOctagon className="text-red-500" />
                {t("report_issue") || "Complaint Management"}
              </CardTitle>
              <Badge variant="outline" className="font-black px-4 py-1.5 rounded-lg border-2">
                {t("total") || "Total"}: {issueMeta.total}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("search_placeholder") || "Search issues..."}
                  value={issueSearch}
                  onChange={(e) => {
                    setIssueSearch(e.target.value);
                    setIssuePage(1);
                  }}
                  className="h-11 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-w-[220px]"
                />
              </div>

              {/* Filter Dropdown */}
              <select
                value={issueFilter}
                onChange={(e) => {
                  setIssueFilter(e.target.value);
                  setIssuePage(1);
                }}
                className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="ALL">{t("all") || "All"}</option>
                <option value="OPEN">{t("active") || "Open"}</option>
                <option value="RESOLVED">{t("resolved") || "Resolved"}</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("issue_reason") || "Complaint Reason"}
                </TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("passenger") || "Passenger"}
                </TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("driver") || "Driver"}
                </TableHead>
                <TableHead className="py-5 text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("status") || "Status"}
                </TableHead>
                <TableHead className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("date") || "Report Date"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow 
                  key={issue.id} 
                  className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col gap-2 max-w-[280px]">
                      <Badge variant="outline" className={`w-fit font-black px-2.5 py-1 text-[10px] rounded-lg border uppercase tracking-wider ${getReasonColorClass(issue.reason)}`}>
                        {getReasonLabel(issue.reason)}
                      </Badge>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Booking: #{issue.bookingId.slice(-6).toUpperCase()}
                      </p>
                      {issue.details && (
                        <p className="text-xs font-medium text-slate-500 truncate mt-1">
                          &ldquo;{issue.details}&rdquo;
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-6">
                    <div>
                      <p className="font-black text-slate-900 text-sm">
                        {issue.booking.user?.name || "Passenger"}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {issue.booking.user?.phone}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    {issue.booking.driver ? (
                      <div>
                        <p className="font-black text-slate-900 text-sm">
                          {issue.booking.driver.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-400">
                          {issue.booking.driver.phone}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 italic">No driver assigned</span>
                    )}
                  </TableCell>

                  <TableCell className="py-6">
                    <div className="flex items-center gap-2">
                      {issue.status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          {t("active") || "Open"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t("resolved") || "Resolved"}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-8 text-right py-6">
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-xs font-bold text-slate-800">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <AppButton 
                        variant="ghost"
                        className="!p-0 !h-auto text-primary hover:text-primary-dark text-xs font-black uppercase flex items-center gap-1.5 mt-1 transition-all group hover:bg-transparent"
                      >
                        {t("view_details") || "Details"}
                        <Eye size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </AppButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                        <AlertOctagon size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-wider">No complaints found</p>
                        <p className="text-xs font-medium text-slate-400 max-w-[280px] mx-auto">There are no passenger complaint records matching your search/filters right now.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {issueMeta.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Page {issuePage} of {issueMeta.totalPages}
          </p>
          <div className="flex gap-2">
            <AppButton
              variant="outline"
              className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest"
              onClick={() => setIssuePage(Math.max(1, issuePage - 1))}
              disabled={issuePage === 1}
              leftIcon={<ChevronLeft size={14} />}
            >
              Prev
            </AppButton>
            <AppButton
              variant="outline"
              className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest"
              onClick={() => setIssuePage(Math.min(issueMeta.totalPages, issuePage + 1))}
              disabled={issuePage === issueMeta.totalPages}
              rightIcon={<ChevronRight size={14} />}
            >
              Next
            </AppButton>
          </div>
        </div>
      )}

      {/* Detailed Complaint Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                  <AlertOctagon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {t("report_issue") || "Complaint Details"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`font-black px-2.5 py-0.5 text-[9px] rounded-lg border uppercase tracking-wider ${getReasonColorClass(selectedIssue.reason)}`}>
                      {getReasonLabel(selectedIssue.reason)}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Booking: #{selectedIssue.bookingId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <AppButton 
                variant="ghost"
                onClick={() => {
                  setSelectedIssue(null);
                  setResolutionNote("");
                }}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100/80 !p-2.5 !h-auto rounded-full transition-all text-xs font-black uppercase"
              >
                {t("close_btn") || "Close"}
              </AppButton>
            </div>

            {/* Trip Context Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 border border-slate-100 rounded-3xl p-6 mb-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trip Context</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-slate-700 font-bold">
                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Pickup</p>
                      <p>{selectedIssue.booking.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-700 font-bold">
                    <Navigation size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Destination</p>
                      <p>{selectedIssue.booking.destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200/50 pt-4 md:pt-0 md:pl-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Fare</span>
                    <span className="text-sm font-black text-slate-900">৳{selectedIssue.booking.fare}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Booking Status</span>
                    <span className="text-xs font-black text-slate-700 uppercase">{selectedIssue.booking.status}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Created</span>
                    <span className="text-xs font-bold text-slate-600">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* People Involved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Passenger */}
              <div className="border border-slate-100 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger</span>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{selectedIssue.booking.user?.name || "Passenger"}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{selectedIssue.booking.user?.phone}</p>
                </div>
              </div>

              {/* Driver */}
              <div className="border border-slate-100 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-primary" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported Driver</span>
                </div>
                {selectedIssue.booking.driver ? (
                  <div>
                    <p className="text-sm font-black text-slate-800">{selectedIssue.booking.driver.name}</p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{selectedIssue.booking.driver.phone}</p>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400 italic">No driver assigned</span>
                )}
              </div>
            </div>

            {/* Complaint Details */}
            <div className="space-y-2 mb-8 bg-slate-50 border border-slate-100 rounded-3xl p-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details Narrative</span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                {selectedIssue.details ? `"${selectedIssue.details}"` : "No descriptive details were provided by the passenger."}
              </p>
            </div>

            {/* Resolution Block */}
            {selectedIssue.status === "OPEN" ? (
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Administrative Action Required
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Mandatory Resolution Note <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Document the actions taken, warnings issued, or adjustments made to resolve this issue..."
                    className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all min-h-[110px] resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <AppButton
                    className="h-13 rounded-xl border-2 border-slate-100 text-slate-500 hover:bg-slate-50 font-black uppercase tracking-widest text-xs px-6"
                    onClick={() => {
                      setSelectedIssue(null);
                      setResolutionNote("");
                    }}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    className="h-13 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs px-6"
                    onClick={onResolveSubmit}
                    loading={isResolving}
                    disabled={!resolutionNote.trim()}
                  >
                    Resolve & Close Complaint
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Complaint Resolved
                  </span>
                </div>
                <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-3xl p-6 space-y-3">
                  <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Resolution Audit Note</span>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed mt-1">
                      {selectedIssue.resolutionNote}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100">
                    <span>Audit Status: COMPLETE</span>
                    <span>
                      Resolved: {selectedIssue.resolvedAt ? new Date(selectedIssue.resolvedAt).toLocaleString() : ""}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <AppButton
                    className="h-13 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs px-6"
                    onClick={() => {
                      setSelectedIssue(null);
                      setResolutionNote("");
                    }}
                  >
                    Close Viewer
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
