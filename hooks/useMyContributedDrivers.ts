"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";

export interface UserContributedDriver {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  nearbyBazar: string | null;
  vehicleType: string;
  isApproved: boolean;
  createdAt: string;
}

export function useMyContributedDrivers() {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<UserContributedDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete modal states
  const [driverToDelete, setDriverToDelete] = useState<UserContributedDriver | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal states
  const [editingDriver, setEditingDriver] = useState<UserContributedDriver | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchMyDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/contributed-drivers");
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error("Failed to fetch my contributed drivers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyDrivers();
  }, [fetchMyDrivers]);

  const openDeleteModal = (driver: UserContributedDriver) => {
    setDriverToDelete(driver);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDriverToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!driverToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading(t("loading" as TextKey) || "মুছে ফেলা হচ্ছে...");

    try {
      const res = await fetch(`/api/contributed-drivers/${driverToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t("delete_success" as TextKey) || "ড্রাইভার সফলভাবে মুছে ফেলা হয়েছে", { id: toastId });
        setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));
        closeDeleteModal();
      } else {
        const data = await res.json();
        toast.error(data.error || (t("delete_failed" as TextKey) || "মুছে ফেলা সম্ভব হয়নি"), { id: toastId });
      }
    } catch (err) {
      console.error("Error deleting contributed driver:", err);
      toast.error(t("network_error" as TextKey) || "নেটওয়ার্ক সমস্যা", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (driver: UserContributedDriver) => {
    setEditingDriver(driver);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDriver(null);
  };

  return {
    drivers,
    count: drivers.length,
    isLoading,
    isDeleteModalOpen,
    driverToDelete,
    isDeleting,
    editingDriver,
    isEditModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
    openEditModal,
    closeEditModal,
    refetch: fetchMyDrivers,
  };
}
