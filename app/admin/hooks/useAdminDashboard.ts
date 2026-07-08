import { useState, useEffect } from "react";
import { useQueryState } from "nuqs";
import { useLang } from "@/hooks/useLang";
import { User as UserType } from "@/lib/types/user";
import { TextKey } from "@/constants/text";

export type AdminTab = "overview" | "users" | "waitlist" | "contributed-drivers" | "bazars" | "settings";

export interface WaitlistEntry {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  location: string | null;
  createdAt: string;
}

export interface ContributedDriver {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  nearbyBazar: string | null;
  vehicleType: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  contributorName?: string | null;
  contributorPhone?: string | null;
  contributorPhotoUrl?: string | null;
  callCount?: number;
}

interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

interface AdminStats {
  totalUsers: number;
  totalWaitlist: number;
  totalContributedDrivers: number;
  pendingContributedDrivers: number;
  totalBazars: number;
  pwaInstallations: number;
  totalCallClicks: number;
}

export function useAdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [bazars, setBazars] = useState<{ id: string; name: string; isApproved: boolean }[]>([]);
  const [newBazarName, setNewBazarName] = useState("");
  const [editingBazar, setEditingBazar] = useState<{ id: string; name: string } | null>(null);
  const [activeTabStr, setActiveTabStr] = useQueryState("tab", { defaultValue: "overview" });
  const activeTab = (activeTabStr as AdminTab) || "overview";
  const setActiveTab = (val: AdminTab) => setActiveTabStr(val);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [settings, setSettings] = useState<SystemSetting[]>([]);

  // Users State
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const [userMeta, setUserMeta] = useState({ total: 0, totalPages: 0 });

  // Waitlist State
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [debouncedWaitlistSearch, setDebouncedWaitlistSearch] = useState("");
  const [waitlistFilter, setWaitlistFilter] = useState("ALL");
  const [waitlistPage, setWaitlistPage] = useState(1);
  const [waitlistMeta, setWaitlistMeta] = useState({
    total: 0,
    totalPages: 0,
    driverCount: 0,
    passengerCount: 0,
  });

  // Contributed Drivers State
  const [contributedDrivers, setContributedDrivers] = useState<ContributedDriver[]>([]);
  const [contributedSearch, setContributedSearch] = useState("");
  const [debouncedContributedSearch, setDebouncedContributedSearch] = useState("");
  const [contributedFilter, setContributedFilter] = useState("all");
  const [isContributedEditModalOpen, setIsContributedEditModalOpen] = useState(false);
  const [editingContributedDriverData, setEditingContributedDriverData] = useState<ContributedDriver | null>(null);

  // Debounce Hooks
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 1000);
    return () => clearTimeout(handler);
  }, [userSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedWaitlistSearch(waitlistSearch);
    }, 1000);
    return () => clearTimeout(handler);
  }, [waitlistSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContributedSearch(contributedSearch);
    }, 1000);
    return () => clearTimeout(handler);
  }, [contributedSearch]);

  // Fetch functions
  const fetchUsers = async (page = 1, search = "", role = "ALL") => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}&role=${role}`);
      const data = await res.json();
      setAllUsers(Array.isArray(data?.users) ? data.users : []);
      setUserMeta({
        total: data?.meta?.total || 0,
        totalPages: data?.meta?.totalPages || 0,
      });
    } catch (e) {
      console.error("Fetch users error:", e);
    }
  };

  const fetchWaitlist = async (page = 1, search = "", filter = "ALL") => {
    try {
      const res = await fetch(`/api/admin/waitlist?page=${page}&limit=20&search=${search}&role=${filter}`);
      const data = await res.json();
      setWaitlist(Array.isArray(data?.waitlist) ? data.waitlist : []);
      setWaitlistMeta({
        total: data?.meta?.total || 0,
        totalPages: data?.meta?.totalPages || 0,
        driverCount: data?.meta?.driverCount || 0,
        passengerCount: data?.meta?.passengerCount || 0,
      });
    } catch (e) {
      console.error("Fetch waitlist error:", e);
    }
  };

  const fetchContributedDrivers = async (search = "", filter = "all") => {
    try {
      // Endpoint app/api/admin/contributed-drivers/route.ts
      const res = await fetch(`/api/admin/contributed-drivers?search=${search}&filter=${filter}`);
      const data = await res.json();
      setContributedDrivers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch contributed drivers error:", e);
    }
  };

  const fetchData = async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) setIsRefreshing(true);
    try {
      const [resStats, resBazars, resSettings] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/bazars?all=true"),
        fetch("/api/admin/settings"),
      ]);

      const dataStats = await resStats.json().catch(() => ({}));
      const dataBazars = await resBazars.json().catch(() => ([]));
      const dataSettings = await resSettings.json().catch(() => ([]));

      setStats(dataStats?.stats || null);
      setSettings(Array.isArray(dataSettings) ? dataSettings : []);

      if (Array.isArray(dataBazars)) {
        setBazars(dataBazars);
      } else if (dataBazars && typeof dataBazars === "object" && "bazars" in dataBazars && Array.isArray((dataBazars as Record<string, unknown>).bazars)) {
        setBazars((dataBazars as { bazars: { id: string; name: string; isApproved: boolean }[] }).bazars);
      } else {
        setBazars([]);
      }

      await Promise.all([
        fetchUsers(userPage, debouncedUserSearch, userFilter),
        fetchWaitlist(waitlistPage, debouncedWaitlistSearch, waitlistFilter),
        fetchContributedDrivers(debouncedContributedSearch, contributedFilter),
      ]);
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
    if (activeTab === "users") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers(userPage, debouncedUserSearch, userFilter);
    }
  }, [userPage, debouncedUserSearch, userFilter, activeTab]);

  useEffect(() => {
    if (activeTab === "waitlist") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchWaitlist(waitlistPage, debouncedWaitlistSearch, waitlistFilter);
    }
  }, [waitlistPage, debouncedWaitlistSearch, waitlistFilter, activeTab]);

  useEffect(() => {
    if (activeTab === "contributed-drivers") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchContributedDrivers(debouncedContributedSearch, contributedFilter);
    }
  }, [debouncedContributedSearch, contributedFilter, activeTab]);

  const handleAddBazar = async () => {
    if (!newBazarName.trim()) return;
    try {
      const res = await fetch("/api/bazars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBazarName.trim() }),
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
        method: "DELETE",
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
        body: JSON.stringify({ name: editingBazar.name.trim() }),
      });
      if (res.ok) {
        setEditingBazar(null);
        fetchData({ showLoading: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWaitlist = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWaitlist(waitlistPage, debouncedWaitlistSearch, waitlistFilter);
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json().catch(() => ({}));
        if (dataStats?.stats) setStats(dataStats.stats);
      }
    } catch (e) {
      console.error("Delete waitlist entry error:", e);
    }
  };

  const handleApproveContributedDriver = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contributed-drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setContributedDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json().catch(() => ({}));
        if (dataStats?.stats) setStats(dataStats.stats);
      }
    } catch (e) {
      console.error("Approve contributed driver error:", e);
    }
  };

  const handleDeleteContributedDriver = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contributed-drivers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setContributedDrivers((prev) => prev.filter((d) => d.id !== id));
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json().catch(() => ({}));
        if (dataStats?.stats) setStats(dataStats.stats);
      }
    } catch (e) {
      console.error("Delete contributed driver error:", e);
    }
  };

  const handleUpdateContributedDriver = async (id: string, data: Partial<ContributedDriver>) => {
    const res = await fetch(`/api/admin/contributed-drivers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setContributedDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return true;
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update driver");
    }
  };

  const handleApproveBazar = async (id: string) => {
    try {
      const res = await fetch(`/api/bazars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
      if (res.ok) {
        setBazars((prev) => prev.map((b) => (b.id === id ? { ...b, isApproved: true } : b)));
      }
    } catch (e) {
      console.error("Approve bazar error:", e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t("delete_user" as TextKey) || "Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUsers(userPage, debouncedUserSearch, userFilter);
        const resStats = await fetch("/api/admin/stats");
        const dataStats = await resStats.json().catch(() => ({}));
        if (dataStats?.stats) setStats(dataStats.stats);
      }
    } catch (e) {
      console.error("Delete user error:", e);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        const updatedSetting = await res.json();
        setSettings((prev) => {
          const exists = prev.find((s) => s.key === key);
          if (exists) {
            return prev.map((s) => (s.key === key ? updatedSetting : s));
          }
          return [...prev, updatedSetting];
        });
      }
    } catch (e) {
      console.error("Update setting error:", e);
    }
  };

  return {
    t,
    stats,
    allUsers,
    bazars,
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
    setWaitlist,
    waitlistSearch,
    setWaitlistSearch,
    waitlistFilter,
    setWaitlistFilter,
    waitlistPage,
    setWaitlistPage,
    waitlistMeta,
    fetchWaitlist,
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
    handleApproveBazar,
    handleDeleteUser,
  };
}
