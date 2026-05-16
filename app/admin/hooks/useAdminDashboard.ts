import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { useLang } from "@/hooks/useLang";
import { User as UserType } from "@/lib/types/user";
import { Booking } from "@/lib/types/booking";
import { AdminStats, PendingDriver } from "@/lib/types/admin";

export type AdminTab = "overview" | "drivers" | "users" | "logs" | "bazars" | "settings";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

export function useAdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [bazars, setBazars] = useState<{ id: string, name: string, driverCount?: number }[]>([]);
  const [newBazarName, setNewBazarName] = useState("");
  const [editingBazar, setEditingBazar] = useState<{ id: string, name: string } | null>(null);
  const [activeTabStr, setActiveTabStr] = useQueryState("tab", { defaultValue: "overview" });
  const activeTab = (activeTabStr as AdminTab) || "overview";
  const setActiveTab = (val: AdminTab) => setActiveTabStr(val);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // Sorting & Pagination state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Booking | "fee" | "driver_payout"; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Wallet Recharge State
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeNote, setRechargeNote] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriverData, setEditingDriverData] = useState<PendingDriver | null>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [debouncedDriverSearch, setDebouncedDriverSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDriverSearch(driverSearch);
    }, 1000);
    return () => clearTimeout(handler);
  }, [driverSearch]);

  const [driverSort, setDriverSort] = useState("latest");
  const [driverPage, setDriverPage] = useState(1);
  const [driverMeta, setDriverMeta] = useState({ total: 0, totalPages: 0 });

  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<PendingDriver[]>([]);
  const [allDrivers, setAllDrivers] = useState<PendingDriver[]>([]);

  const handleSort = (key: keyof Booking | "fee" | "driver_payout") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const fetchDrivers = async (page = 1, search = "", filter = "all", sort = "latest") => {
    try {
      const res = await fetch(`/api/admin/drivers?page=${page}&limit=20&search=${search}&filter=${filter}&sort=${sort}`);
      const data = await res.json();
      setAllDrivers(Array.isArray(data?.drivers) ? data.drivers : []);
      setDriverMeta({
        total: data?.meta?.total || 0,
        totalPages: data?.meta?.totalPages || 0
      });
    } catch (e) {
      console.error("Fetch drivers error:", e);
    }
  };

  const fetchData = async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setIsRefreshing(true);
    try {
      const url = logFilter === "ALL"
        ? "/api/admin/bookings?limit=100"
        : `/api/admin/bookings?limit=100&status=${logFilter}`;

      const [resStats, resBookings, resDrivers, resActive, resOnline, resAllUsers, resBazars, resSettings] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(url),
        fetch("/api/admin/drivers/approve"),
        fetch("/api/admin/bookings?type=active"),
        fetch("/api/admin/drivers/online"),
        fetch("/api/admin/users?limit=100"),
        fetch("/api/bazars"),
        fetch("/api/admin/settings")
      ]);

      const dataStats = await resStats.json().catch(() => ({}));
      const dataBookings = await resBookings.json().catch(() => ({}));
      const dataDrivers = await resDrivers.json().catch(() => ({}));
      const dataActive = await resActive.json().catch(() => ({}));
      const dataOnline = await resOnline.json().catch(() => ({}));
      const dataAllUsers = await resAllUsers.json().catch(() => ({}));
      const dataBazars = await resBazars.json().catch(() => ([]));
      const dataSettings = await resSettings.json().catch(() => ([]));

      setStats(dataStats?.stats || null);
      setBookings(Array.isArray(dataBookings?.bookings) ? dataBookings.bookings : []);
      setPendingDrivers(Array.isArray(dataDrivers?.drivers) ? dataDrivers.drivers : []);
      setActiveBookings(Array.isArray(dataActive?.bookings) ? dataActive.bookings : []);
      setOnlineDrivers(Array.isArray(dataOnline?.drivers) ? dataOnline.drivers : []);
      setAllUsers(Array.isArray(dataAllUsers?.users) ? dataAllUsers.users : []);

      if (activeTab === "drivers") {
        fetchDrivers(driverPage, debouncedDriverSearch, driverFilter, driverSort);
      }

      if (Array.isArray(dataBazars)) {
        setBazars(dataBazars);
      } else if (dataBazars && typeof dataBazars === 'object' && 'bazars' in dataBazars && Array.isArray((dataBazars as Record<string, unknown>).bazars)) {
        setBazars((dataBazars as { bazars: { id: string; name: string; driverCount?: number }[] }).bazars);
      } else {
        setBazars([]);
      }

      setSettings(Array.isArray(dataSettings) ? dataSettings : []);

    } catch (e: unknown) {
      console.error("Admin dashboard fetch error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData({ showLoading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "drivers") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDrivers(driverPage, debouncedDriverSearch, driverFilter, driverSort);
    }
  }, [driverPage, debouncedDriverSearch, driverFilter, driverSort, activeTab]);

  const fetchBookings = async (status: string) => {
    setIsRefreshing(true);
    try {
      const url = status === "ALL"
        ? "/api/admin/bookings?limit=100"
        : `/api/admin/bookings?limit=100&status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (driverId: string) => {
    try {
      const res = await fetch("/api/admin/drivers/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, action: "approve" })
      });
      if (res.ok) {
        setPendingDrivers(prev => prev.filter(d => d.id !== driverId));
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json();
        setStats(dataStats.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSuspend = async (driverId: string, currentlySuspended: boolean) => {
    try {
      const action = currentlySuspended ? "unsuspend" : "suspend";
      const res = await fetch("/api/admin/drivers/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, action })
      });
      if (res.ok) {
        fetchData({ showLoading: true });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBazar = async () => {
    if (!newBazarName.trim()) return;
    try {
      const res = await fetch("/api/bazars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBazarName.trim() })
      });
      if (res.ok) {
        setNewBazarName("");
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBazar = async (id: string) => {
    if (!confirm(t("delete_bazar") + "?")) return;
    try {
      const res = await fetch(`/api/bazars/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBazar = async () => {
    if (!editingBazar || !editingBazar.name.trim()) return;
    try {
      const res = await fetch(`/api/bazars/${editingBazar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingBazar.name.trim() })
      });
      if (res.ok) {
        setEditingBazar(null);
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecharge = async () => {
    if (!selectedDriver || !rechargeAmount || isNaN(Number(rechargeAmount))) return;
    setIsRecharging(true);
    try {
      const res = await fetch("/api/admin/drivers/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver.id,
          amount: Number(rechargeAmount),
          note: rechargeNote || t("payment_collected")
        })
      });
      if (res.ok) {
        setIsRechargeModalOpen(false);
        setRechargeAmount("");
        setRechargeNote("");
        setSelectedDriver(null);
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecharging(false);
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm(t("delete_warning"))) return;
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchDrivers(driverPage, debouncedDriverSearch, driverFilter, driverSort);
      }
    } catch (e) {
      console.error("Delete driver error:", e);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        const updatedSetting = await res.json();
        setSettings(prev => {
          const exists = prev.find(s => s.key === key);
          if (exists) {
            return prev.map(s => s.key === key ? updatedSetting : s);
          }
          return [...prev, updatedSetting];
        });
      }
    } catch (e) {
      console.error("Update setting error:", e);
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = (key === "fee" ? a.fare * 0.2 :
      key === "driver_payout" ? a.fare * 0.8 :
        key === "driver" ? a.driver?.name || "" :
          a[key as keyof Booking]) ?? "";

    const bVal = (key === "fee" ? b.fare * 0.2 :
      key === "driver_payout" ? b.fare * 0.8 :
        key === "driver" ? b.driver?.name || "" :
          b[key as keyof Booking]) ?? "";

    if (aVal === bVal) return 0;

    let result = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      result = aVal < bVal ? -1 : 1;
    } else {
      result = String(aVal).localeCompare(String(bVal));
    }

    return direction === "asc" ? result : -result;
  });

  const paginatedBookings = sortedBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  return {
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
    sortConfig,
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
    driverFilter,
    setDriverFilter,
    driverSort,
    setDriverSort,
    driverPage,
    setDriverPage,
    driverMeta,
    pendingDrivers,
    onlineDrivers,
    allDrivers,
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
    handleUpdateSetting
  };
}
